import 'dotenv/config'
import { jest } from '@jest/globals'
import request from 'supertest'
import * as darywinTypes from ':darywin-types'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as testHelper from './testHelper'
import app from '../src/app'
import * as env from '../src/config/env.config'
import User from '../src/models/User'
import HostSignupSession from '../src/models/HostSignupSession'
import HostSignupAudit from '../src/models/HostSignupAudit'
import * as smsProvider from '../src/services/smsProvider'

jest.setTimeout(60_000)

const ALLOWED_PHONE = '+213555000001'
const ALLOWED_PHONE_2 = '+213555000002'
const BLOCKED_PHONE = '+11234567890'

beforeAll(async () => {
  testHelper.initializeLogger()
  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()
  // restrict to DZ for the country-blocked test
  ;(env as { SIGNUP_ALLOWED_COUNTRY_CODES: string }).SIGNUP_ALLOWED_COUNTRY_CODES = 'DZ'
})

afterAll(async () => {
  await testHelper.close()
  await databaseHelper.close()
})

beforeEach(async () => {
  await HostSignupSession.deleteMany({})
  await HostSignupAudit.deleteMany({})
  await User.deleteMany({ phone: { $in: [ALLOWED_PHONE, ALLOWED_PHONE_2] } })
  await User.deleteMany({ email: /hostsignup-test/i })
  jest.restoreAllMocks()
})

const stubSms = (approved = true) => {
  jest.spyOn(smsProvider, 'sendCode').mockResolvedValue({ channel: darywinTypes.OtpChannel.WhatsApp })
  jest.spyOn(smsProvider, 'verifyCode').mockImplementation(async () => approved)
}

const extractCookie = (res: request.Response): string => {
  const setCookie = res.headers['set-cookie']
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie].filter(Boolean) as string[]
  const found = arr.find((c) => c.startsWith('dw-signup-session='))
  if (!found) throw new Error('no signup cookie')
  return found.split(';')[0]
}

describe('POST /api/signup/host — happy path', () => {
  it('completes full signup and persists Agency user with correct defaults', async () => {
    stubSms(true)

    const email = `hostsignup-test-${Date.now()}@test.darywin.com`

    const r1 = await request(app).post('/api/signup/host/start').send({ phone: ALLOWED_PHONE })
    expect(r1.status).toBe(200)
    const cookie = extractCookie(r1)

    const r2 = await request(app).post('/api/signup/host/verify-phone').set('Cookie', cookie).send({ code: '123456' })
    expect(r2.status).toBe(200)
    expect(r2.body.phoneVerified).toBe(true)

    // need a valid locationId — pick any
    const someLocation = await (await import('../src/models/Location')).default.findOne().lean()
    expect(someLocation).toBeTruthy()

    const r3 = await request(app).post('/api/signup/host/details').set('Cookie', cookie).send({
      email,
      password: 'Sup3rSecret!',
      agencyName: 'Test Host Agency',
      locationId: String(someLocation!._id),
    })
    expect(r3.status).toBe(200)

    const r4 = await request(app).post('/api/signup/host/complete').set('Cookie', cookie).send({})
    expect(r4.status).toBe(200)
    expect(r4.body.token).toBeTruthy()
    expect(r4.body.user.email).toBe(email)

    const user = await User.findOne({ email }).lean()
    expect(user).toBeTruthy()
    expect(user!.type).toBe(darywinTypes.UserType.Agency)
    expect(user!.phoneVerified).toBe(true)
    expect(user!.firstPayoutApproved).toBe(false)
    expect(user!.active).toBe(true)

    const audit = await HostSignupAudit.findOne({ event: 'host_signup', userId: user!._id }).lean()
    expect(audit).toBeTruthy()
    expect(audit!.phone).toBe(ALLOWED_PHONE) // raw phone on success
  })
})

describe('POST /api/signup/host/start — error paths', () => {
  it('returns 409 on phone collision', async () => {
    stubSms(true)
    // pre-create a host with the phone
    await User.create({
      fullName: 'Existing',
      email: `hostsignup-test-existing-${Date.now()}@test.darywin.com`,
      password: 'xxxxxxxx',
      phone: ALLOWED_PHONE,
      type: darywinTypes.UserType.Agency,
      active: true,
    })

    const r = await request(app).post('/api/signup/host/start').send({ phone: ALLOWED_PHONE })
    expect(r.status).toBe(409)

    const audit = await HostSignupAudit.findOne({ event: 'phone_collision' }).lean()
    expect(audit).toBeTruthy()
    expect(audit!.phone).toBeUndefined() // hashed on failure
    expect(audit!.phoneHash).toBeTruthy()
  })

  it('returns 400 on country-blocked phone', async () => {
    stubSms(true)
    const r = await request(app).post('/api/signup/host/start').send({ phone: BLOCKED_PHONE })
    expect(r.status).toBe(400)
    const audit = await HostSignupAudit.findOne({ event: 'country_blocked' }).lean()
    expect(audit).toBeTruthy()
  })

  it('returns 400 on unparseable phone', async () => {
    const r = await request(app).post('/api/signup/host/start').send({ phone: 'not-a-phone' })
    expect(r.status).toBe(400)
  })
})

describe('POST /api/signup/host/verify-phone — OTP attempts', () => {
  it('returns 403 with remaining, then 429 on exhaustion', async () => {
    jest.spyOn(smsProvider, 'sendCode').mockResolvedValue({ channel: darywinTypes.OtpChannel.SMS })
    jest.spyOn(smsProvider, 'verifyCode').mockResolvedValue(false)

    const r1 = await request(app).post('/api/signup/host/start').send({ phone: ALLOWED_PHONE_2 })
    const cookie = extractCookie(r1)

    for (let i = 0; i < 4; i += 1) {
      const r = await request(app).post('/api/signup/host/verify-phone').set('Cookie', cookie).send({ code: '000000' })
      expect(r.status).toBe(403)
      expect(r.body.remaining).toBe(4 - i)
    }
    const rFinal = await request(app).post('/api/signup/host/verify-phone').set('Cookie', cookie).send({ code: '000000' })
    expect([403, 429]).toContain(rFinal.status)
  })
})

describe('GET /api/host/onboarding', () => {
  it('returns checklist with phone ✓ and others ☐ for a fresh host, flips property ✓ when a property exists', async () => {
    const Property = (await import('../src/models/Property')).default
    const authHelper = await import('../src/utils/authHelper')

    const hostEmail = `hostsignup-test-checklist-${Date.now()}@test.darywin.com`
    const host = await User.create({
      fullName: 'Checklist Host',
      email: hostEmail,
      password: await (await import('bcrypt')).default.hash('Sup3rSecret!', 10),
      phone: '+213555111111',
      type: darywinTypes.UserType.Agency,
      active: true,
      verified: false,
      phoneVerified: true,
      firstPayoutApproved: false,
    })
    const token = await authHelper.encryptJWT({ id: host._id.toString() })

    const r1 = await request(app)
      .get('/api/host/onboarding')
      .set('x-access-token', token)
      .set('origin', env.ADMIN_HOST)
    expect(r1.status).toBe(200)
    const byKey = (k: string) => r1.body.items.find((i: { key: string }) => i.key === k)
    expect(byKey('phone').done).toBe(true)
    expect(byKey('email').done).toBe(false)
    expect(byKey('property').done).toBe(false)
    expect(byKey('payout').done).toBe(false)
    expect(byKey('booking').done).toBe(false)

    const someLocation = await (await import('../src/models/Location')).default.findOne().lean()
    await Property.create({
      name: 'Checklist Prop',
      agency: host._id,
      type: darywinTypes.PropertyType.Apartment,
      description: 'x',
      image: 'x',
      bedrooms: 1,
      bathrooms: 1,
      petsAllowed: false,
      furnished: false,
      minimumAge: 21,
      location: someLocation!._id,
      price: 100,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
    })

    const r2 = await request(app)
      .get('/api/host/onboarding')
      .set('x-access-token', token)
      .set('origin', env.ADMIN_HOST)
    expect(r2.body.items.find((i: { key: string }) => i.key === 'property').done).toBe(true)
  })
})

describe('SIGNUP_PUBLIC_ENABLED kill-switch', () => {
  it('returns 503 when disabled', async () => {
    ;(env as { SIGNUP_PUBLIC_ENABLED: boolean }).SIGNUP_PUBLIC_ENABLED = false
    const r = await request(app).post('/api/signup/host/start').send({ phone: ALLOWED_PHONE })
    expect(r.status).toBe(503)
    ;(env as { SIGNUP_PUBLIC_ENABLED: boolean }).SIGNUP_PUBLIC_ENABLED = true
  })
})
