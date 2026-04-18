import twilio from 'twilio'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'
import * as darywinTypes from ':darywin-types'

export class SmsProviderError extends Error {
  code: 'RATE_LIMIT' | 'CARRIER_UNREACHABLE' | 'SERVICE_UNAVAILABLE' | 'INVALID_CODE' | 'EXPIRED'
  constructor(code: SmsProviderError['code'], message: string) {
    super(message)
    this.code = code
  }
}

const devModeActive = (): boolean =>
  env.SMS_DEV_MODE && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')

let cached: ReturnType<typeof twilio> | null = null
const client = () => {
  if (!cached) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      throw new SmsProviderError('SERVICE_UNAVAILABLE', 'Twilio not configured')
    }
    cached = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  }
  return cached
}

const mapTwilioError = (err: unknown): SmsProviderError => {
  const code = (err as { code?: number }).code
  const status = (err as { status?: number }).status
  if (code === 20429) {
    return new SmsProviderError('RATE_LIMIT', 'twilio rate limit')
  }
  if (code === 60203 || code === 60200) {
    return new SmsProviderError('CARRIER_UNREACHABLE', 'carrier unreachable')
  }
  if (typeof status === 'number' && status >= 500) {
    return new SmsProviderError('SERVICE_UNAVAILABLE', 'twilio 5xx')
  }
  return new SmsProviderError('SERVICE_UNAVAILABLE', (err as Error).message || 'twilio error')
}

export interface SendResult {
  channel: darywinTypes.OtpChannel
}

export const sendCode = async (phone: string): Promise<SendResult> => {
  if (devModeActive()) {
    logger.info(`[smsProvider] DEV MODE: OTP for ${phone} is ${env.SMS_DEV_CODE}`)
    return { channel: darywinTypes.OtpChannel.SMS }
  }
  const verify = client().verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID)
  if (env.TWILIO_WHATSAPP_ENABLED) {
    try {
      await verify.verifications.create({ to: phone, channel: 'whatsapp' })
      return { channel: darywinTypes.OtpChannel.WhatsApp }
    } catch (err) {
      logger.warn('[smsProvider] whatsapp send failed, falling back to sms', err as object)
    }
  }
  try {
    await verify.verifications.create({ to: phone, channel: 'sms' })
    return { channel: darywinTypes.OtpChannel.SMS }
  } catch (err) {
    throw mapTwilioError(err)
  }
}

export const verifyCode = async (phone: string, code: string): Promise<boolean> => {
  if (devModeActive()) {
    return code === env.SMS_DEV_CODE
  }
  const verify = client().verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID)
  try {
    const check = await verify.verificationChecks.create({ to: phone, code })
    return check.status === 'approved'
  } catch (err) {
    throw mapTwilioError(err)
  }
}
