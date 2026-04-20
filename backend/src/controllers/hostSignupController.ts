import type { CookieOptions, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import validator from 'validator'
import * as darywinTypes from ':darywin-types'
import * as env from '../config/env.config'
import User from '../models/User'
import Property from '../models/Property'
import Booking from '../models/Booking'
import HostSignupSession from '../models/HostSignupSession'
import * as smsProvider from '../services/smsProvider'
import { SmsProviderError } from '../services/smsProvider'
import * as phoneUtil from '../utils/phone'
import { PhoneError } from '../utils/phone'
import * as authHelper from '../utils/authHelper'
import { writeAudit } from '../utils/audit'
import { fireAndForget } from '../utils/fireAndForget'
import { signSessionId, verifySessionCookie, cookieOptions, SIGNUP_COOKIE_NAME } from '../utils/signupSession'
import { BRIDGE_COOKIE_NAME, BRIDGE_TOKEN_TTL_SECONDS, bridgeCookieOptions } from '../utils/signupBridge'
import * as logger from '../utils/logger'
import axios from 'axios'

const MAX_OTP_ATTEMPTS = 5

const setSessionCookie = (res: Response, sessionId: string) => {
  res.cookie(SIGNUP_COOKIE_NAME, signSessionId(sessionId), cookieOptions())
}

export const start = async (req: Request, res: Response) => {
  const { phone, language } = (req.body || {}) as darywinTypes.HostSignupStartPayload
  let parsed
  try {
    parsed = phoneUtil.parseAndValidate(phone)
  } catch (err) {
    const pe = err as PhoneError
    if (pe.code === 'COUNTRY_BLOCKED') {
      writeAudit({ event: 'country_blocked', phone, req })
      return res.status(400).json({ code: 'COUNTRY_BLOCKED' })
    }
    return res.status(400).json({ code: 'INVALID_PHONE' })
  }

  const existing = await User.findOne({ phone: parsed.e164, type: darywinTypes.UserType.Agency }).select('_id').lean()
  if (existing) {
    writeAudit({ event: 'phone_collision', phone: parsed.e164, req })
    return res.status(409).json({ code: 'CONFLICT' })
  }

  let sendResult
  try {
    sendResult = await smsProvider.sendCode(parsed.e164)
  } catch (err) {
    const sm = err as SmsProviderError
    if (sm.code === 'RATE_LIMIT') {
      writeAudit({ event: 'rate_limited', phone: parsed.e164, req })
      return res.status(429).json({ code: 'RATE_LIMITED' })
    }
    writeAudit({ event: 'otp_send_failed', phone: parsed.e164, req, reason: sm.code })
    return res.status(503).json({ code: 'SERVICE_UNAVAILABLE' })
  }

  const session = await HostSignupSession.create({
    phone: parsed.e164,
    country: parsed.country,
    channel: sendResult.channel,
    language: language || 'en',
  })
  setSessionCookie(res, session._id.toString())
  return res.status(200).json({ sessionId: session._id.toString(), channel: sendResult.channel })
}

export const verifyPhone = async (req: Request, res: Response) => {
  const session = req.signupSession!
  const { code } = (req.body || {}) as darywinTypes.VerifyPhonePayload
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ code: 'INVALID_CODE' })
  }
  if (session.otpAttempts >= MAX_OTP_ATTEMPTS) {
    writeAudit({ event: 'rate_limited', phone: session.phone, req, reason: 'otp_attempts_exhausted' })
    return res.status(429).json({ code: 'OTP_EXHAUSTED' })
  }
  let approved = false
  try {
    approved = await smsProvider.verifyCode(session.phone, code)
  } catch (err) {
    const sm = err as SmsProviderError
    writeAudit({ event: 'otp_failed', phone: session.phone, req, reason: sm.code })
    return res.status(503).json({ code: 'SERVICE_UNAVAILABLE' })
  }
  if (!approved) {
    session.otpAttempts += 1
    await session.save()
    writeAudit({ event: 'otp_failed', phone: session.phone, req })
    const remaining = MAX_OTP_ATTEMPTS - session.otpAttempts
    if (remaining <= 0) {
      return res.status(429).json({ code: 'OTP_EXHAUSTED' })
    }
    return res.status(403).json({ code: 'OTP_WRONG', remaining })
  }
  session.phoneVerified = true
  await session.save()
  return res.status(200).json({ phoneVerified: true, nextStep: darywinTypes.OnboardingStep.Email })
}

export const details = async (req: Request, res: Response) => {
  const session = req.signupSession!
  if (!session.phoneVerified) {
    return res.status(401).json({ code: 'PHONE_NOT_VERIFIED' })
  }
  const { email, password, agencyName, locationId } = (req.body || {}) as darywinTypes.HostSignupDetailsPayload
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ code: 'INVALID_EMAIL' })
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ code: 'WEAK_PASSWORD' })
  }
  if (!agencyName || agencyName.trim().length < 2) {
    return res.status(400).json({ code: 'INVALID_AGENCY_NAME' })
  }
  if (!locationId) {
    return res.status(400).json({ code: 'INVALID_LOCATION' })
  }

  const emailExists = await User.findOne({ email: email.toLowerCase() }).select('_id').lean()
  if (emailExists) {
    writeAudit({ event: 'email_collision', phone: session.phone, req })
    return res.status(409).json({ code: 'CONFLICT' })
  }

  session.email = email.toLowerCase()
  session.passwordHash = await bcrypt.hash(password, 10)
  session.agencyName = agencyName.trim()
  session.locationId = locationId as unknown as typeof session.locationId
  await session.save()
  return res.status(200).json({ nextStep: darywinTypes.OnboardingStep.Property })
}

interface TeaserProperty {
  name: string
  address: string
  price: number
  latitude?: number
  longitude?: number
}

const computeFlags = async (teaser?: TeaserProperty): Promise<string[]> => {
  const flags: string[] = []
  if (teaser?.latitude && teaser?.longitude) {
    const existing = await Property.findOne({
      latitude: { $gte: teaser.latitude - 0.0005, $lte: teaser.latitude + 0.0005 },
      longitude: { $gte: teaser.longitude - 0.0005, $lte: teaser.longitude + 0.0005 },
    }).select('_id').lean()
    if (existing) flags.push('duplicate_address')
  }
  return flags
}

const notifyFounder = (user: { _id: unknown; fullName: string; phone?: string }, flags: string[]) => {
  if (!env.FOUNDER_ALERT_WEBHOOK) return
  const text = `New host signup: ${user.fullName} · ${user.phone || ''}${flags.length ? ` · flags: ${flags.join(',')}` : ''}. Call them this week.`
  fireAndForget('founder-alert', axios.post(env.FOUNDER_ALERT_WEBHOOK, { text }))
}

export const complete = async (req: Request, res: Response) => {
  const session = req.signupSession!
  if (!session.phoneVerified || !session.email || !session.passwordHash || !session.agencyName) {
    return res.status(400).json({ code: 'SESSION_INCOMPLETE' })
  }

  const phoneStillFree = !(await User.findOne({ phone: session.phone, type: darywinTypes.UserType.Agency }).select('_id').lean())
  if (!phoneStillFree) {
    writeAudit({ event: 'phone_collision', phone: session.phone, req })
    return res.status(409).json({ code: 'CONFLICT' })
  }
  const emailStillFree = !(await User.findOne({ email: session.email }).select('_id').lean())
  if (!emailStillFree) {
    writeAudit({ event: 'email_collision', phone: session.phone, req })
    return res.status(409).json({ code: 'CONFLICT' })
  }

  const teaser = (req.body || {} as darywinTypes.HostSignupCompletePayload).teaserProperty as TeaserProperty | undefined

  if (teaser) {
    if (teaser.price != null && (typeof teaser.price !== 'number' || teaser.price <= 0)) {
      return res.status(400).json({ code: 'INVALID_TEASER' })
    }
    if (teaser.name && teaser.name.length > 500) {
      return res.status(400).json({ code: 'INVALID_TEASER' })
    }
    if (teaser.address && teaser.address.length > 500) {
      return res.status(400).json({ code: 'INVALID_TEASER' })
    }
    if (teaser.latitude != null && (teaser.latitude < -90 || teaser.latitude > 90)) {
      return res.status(400).json({ code: 'INVALID_TEASER' })
    }
    if (teaser.longitude != null && (teaser.longitude < -180 || teaser.longitude > 180)) {
      return res.status(400).json({ code: 'INVALID_TEASER' })
    }
  }

  let user
  try {
    user = await User.create({
      type: darywinTypes.UserType.Agency,
      fullName: session.agencyName,
      email: session.email,
      phone: session.phone,
      password: session.passwordHash,
      active: true,
      verified: false,
      language: session.language,
      phoneVerified: true,
      firstPayoutApproved: false,
      onboardingStep: teaser ? darywinTypes.OnboardingStep.Payout : darywinTypes.OnboardingStep.Property,
    })
  } catch (err: unknown) {
    const mongoErr = err as { code?: number }
    if (mongoErr.code === 11000) {
      writeAudit({ event: 'duplicate_signup', phone: session.phone, req })
      return res.status(409).json({ code: 'CONFLICT' })
    }
    throw err
  }

  let flags: string[] = []
  if (teaser) {
    flags = await computeFlags(teaser)
    await Property.create({
      name: teaser.name,
      agency: user._id,
      type: darywinTypes.PropertyType.Apartment,
      description: '',
      image: '',
      bedrooms: 0,
      bathrooms: 0,
      petsAllowed: false,
      furnished: false,
      minimumAge: env.MINIMUM_AGE,
      location: session.locationId,
      address: teaser.address,
      latitude: teaser.latitude,
      longitude: teaser.longitude,
      price: teaser.price,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
      available: true,
      hidden: true,
    }).catch((err) => {
      logger.warn('[hostSignup] teaser property creation failed', err as object)
    })
  }

  writeAudit({ event: 'host_signup', userId: user._id, phone: session.phone, flags, req })
  notifyFounder({ _id: user._id, fullName: user.fullName, phone: user.phone }, flags)

  session.completed = true
  await session.save()
  res.clearCookie(SIGNUP_COOKIE_NAME, cookieOptions())

  const bridgeToken = await authHelper.signPurposeToken(
    { id: user._id.toString(), purpose: 'host-signup' },
    BRIDGE_TOKEN_TTL_SECONDS,
  )
  res.cookie(BRIDGE_COOKIE_NAME, bridgeToken, bridgeCookieOptions())

  return res.status(200).json({
    user: {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      type: user.type,
      onboardingStep: user.onboardingStep,
    },
  })
}

export const consumeSignupToken = async (req: Request, res: Response) => {
  const reject = (status: number, code: string, reason: string) => {
    writeAudit({ event: 'signup_token_rejected', req, reason })
    return res.status(status).json({ code })
  }

  if (!authHelper.isAdmin(req)) {
    return reject(403, 'FORBIDDEN', 'origin_not_admin')
  }

  const token = req.signedCookies?.[BRIDGE_COOKIE_NAME] as string | undefined
  if (!token || typeof token !== 'string') {
    return reject(401, 'INVALID_TOKEN', 'no_bridge_cookie')
  }

  let payload: authHelper.PurposeBoundPayload
  try {
    payload = await authHelper.verifyPurposeToken(token, 'host-signup')
  } catch {
    res.clearCookie(BRIDGE_COOKIE_NAME, bridgeCookieOptions())
    return reject(401, 'INVALID_TOKEN', 'verify_failed')
  }

  const user = await User.findById(payload.id)
  if (!user || user.type !== darywinTypes.UserType.Agency || user.blacklisted) {
    res.clearCookie(BRIDGE_COOKIE_NAME, bridgeCookieOptions())
    return reject(401, 'INVALID_TOKEN', 'user_invalid')
  }

  // One-time use: reject if a session has already been minted from a token
  // issued at or before this token's iat.
  const consumedAtSec = user.signupTokenConsumedAt
    ? Math.floor(user.signupTokenConsumedAt.getTime() / 1000)
    : 0
  if (payload.iat <= consumedAtSec) {
    res.clearCookie(BRIDGE_COOKIE_NAME, bridgeCookieOptions())
    return reject(401, 'INVALID_TOKEN', 'replay')
  }

  user.signupTokenConsumedAt = new Date()
  await user.save()

  const sessionToken = await authHelper.encryptJWT({ id: user._id.toString() })
  const opts: CookieOptions = { ...env.COOKIE_OPTIONS, maxAge: env.JWT_EXPIRE_AT * 1000 }
  const cookieName = authHelper.getAuthCookieName(req)

  writeAudit({ event: 'signup_token_consumed', userId: user._id, req })

  return res
    .clearCookie(BRIDGE_COOKIE_NAME, bridgeCookieOptions())
    .clearCookie(cookieName)
    .cookie(cookieName, sessionToken, opts)
    .status(200)
    .json({
      _id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      language: user.language,
      enableEmailNotifications: user.enableEmailNotifications,
      blacklisted: user.blacklisted,
      avatar: user.avatar,
    })
}

// Used by loadSignupSession guard indirectly — no-op getter for wizard resume.
export const currentSession = async (req: Request, res: Response) => {
  const session = req.signupSession!
  return res.status(200).json({
    phoneVerified: session.phoneVerified,
    email: session.email,
    channel: session.channel,
    nextStep: !session.phoneVerified
      ? darywinTypes.OnboardingStep.Phone
      : !session.email
        ? darywinTypes.OnboardingStep.Email
        : darywinTypes.OnboardingStep.Property,
  })
}

// Expose for testing cookie parsing independently.
export const __test__ = { verifySessionCookie }

export const getOnboardingChecklist = async (req: Request, res: Response) => {
  const userId = req.user?._id
  if (!userId) {
    return res.status(401).json({ code: 'UNAUTHORIZED' })
  }
  const user = await User.findById(userId).lean()
  if (!user) {
    return res.status(404).json({ code: 'NOT_FOUND' })
  }
  const [propertyCount, hasPaidBooking] = await Promise.all([
    Property.countDocuments({ agency: userId }),
    Booking.exists({ agency: userId, status: darywinTypes.BookingStatus.Paid }),
  ])
  const items: darywinTypes.OnboardingChecklistItem[] = [
    { key: 'phone', done: !!user.phoneVerified },
    { key: 'email', done: !!user.verified },
    { key: 'property', done: propertyCount > 0, cta: '/create-property' },
    { key: 'payout', done: !!user.payoutAccountId, cta: '/settings' },
    { key: 'booking', done: !!hasPaidBooking },
  ]
  return res.status(200).json({
    items,
    step: user.onboardingStep || darywinTypes.OnboardingStep.Done,
  })
}
