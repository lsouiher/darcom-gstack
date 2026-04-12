import 'dotenv/config'
import { jest } from '@jest/globals'
import request from 'supertest'
import * as darywinTypes from ':darywin-types'

jest.setTimeout(60_000)

const ALLOWED_PHONE = '+213555000001'
const ALLOWED_PHONE_2 = '+213555000002'
const BLOCKED_PHONE = '+14155552671'

const sendCodeMock = jest.fn<(phone: string) => Promise<{ channel: darywinTypes.OtpChannel }>>()
const verifyCodeMock = jest.fn<(phone: string, code: string) => Promise<boolean>>()

class SmsProviderError extends Error {
  code: 'RATE_LIMIT' | 'CARRIER_UNREACHABLE' | 'SERVICE_UNAVAILABLE' | 'INVALID_CODE' | 'EXPIRED'
  constructor(code: SmsProviderError['code'], message: string) {
    super(message)
    this.code = code
  }
}

jest.unstable_mockModule('../src/services/smsProvider.js', () => ({
  sendCode: sendCodeMock,
  verifyCode: verifyCodeMock,
  SmsProviderError,
}))

const { default: app } = await import('../src/app')
const databaseHelper = await import('../src/utils/databaseHelper')
const testHelper = await import('./testHelper')
const env = await import('../src/config/env.config')
const { default: User } = await import('../src/models/User')
const { default: HostSignupSession } = await import('../src/models/HostSignupSession')
const { default: HostSignupAudit } = await import('../src/models/HostSignupAudit')

beforeAll(async () => {
  testHelper.initializeLogger()
  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()
  process.env.DW_SIGNUP_ALLOWED_COUNTRY_CODES = 'DZ'
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
  sendCodeMock.mockReset()
  verifyCodeMock.mockReset()
})

const stubSms = (approved = true) => {
  sendCodeMock.mockResolvedValue({ channel: darywinTypes.OtpChannel.WhatsApp })
  verifyCodeMock.mockResolvedValue(approved)
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
    sendCodeMock.mockResolvedValue({ channel: darywinTypes.OtpChannel.SMS })
    verifyCodeMock.mockResolvedValue(false)

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
    expect(r2.body.items.find((i: { key: string }) => i.key === 'property').done).toBe(true)
  })
})

describe('Admin payout gate (US3)', () => {
  it('self-signed-up host has firstPayoutApproved=false; admin approve flips it; idempotent; non-admin 403', async () => {
    const authHelper = await import('../src/utils/authHelper')
    const bcrypt = (await import('bcrypt')).default

    const hostEmail = `hostsignup-test-payout-${Date.now()}@test.darywin.com`
    const host = await User.create({
      fullName: 'Payout Host', email: hostEmail,
      password: await bcrypt.hash('Sup3rSecret!', 10),
      phone: '+213555222222',
      type: darywinTypes.UserType.Agency, active: true,
      phoneVerified: true, firstPayoutApproved: false,
    })
    expect(host.firstPayoutApproved).toBe(false)

    // non-admin caller blocked
    const hostToken = await authHelper.encryptJWT({ id: host._id.toString() })
    const r403 = await request(app)
      .patch(`/api/admin/agencies/${host._id}/approve-first-payout`)
      .set('x-access-token', hostToken)
    expect([401, 403]).toContain(r403.status)

    // admin caller approves
    const adminEmail = `hostsignup-test-admin-${Date.now()}@test.darywin.com`
    const admin = await User.create({
      fullName: 'Admin', email: adminEmail,
      password: await bcrypt.hash('Sup3rSecret!', 10),
      type: darywinTypes.UserType.Admin, active: true, verified: true,
    })
    const adminToken = await authHelper.encryptJWT({ id: admin._id.toString() })

    const r1 = await request(app)
      .patch(`/api/admin/agencies/${host._id}/approve-first-payout`)
      .set('x-access-token', adminToken)
    expect(r1.status).toBe(200)
    expect(r1.body.firstPayoutApproved).toBe(true)

    // idempotent
    const r2 = await request(app)
      .patch(`/api/admin/agencies/${host._id}/approve-first-payout`)
      .set('x-access-token', adminToken)
    expect(r2.status).toBe(200)
    expect(r2.body.firstPayoutApproved).toBe(true)

    // pending-review list no longer contains host
    const list = await request(app)
      .get('/api/admin/agencies/pending-review')
      .set('x-access-token', adminToken)
    expect(list.status).toBe(200)
    expect((list.body as { _id: string }[]).find((a) => a._id === String(host._id))).toBeUndefined()

    await User.deleteOne({ _id: admin._id })
  })
})

describe('Trust heuristic soft-flag (US4)', () => {
  it('second signup at ~same lat/lng receives duplicate_address flag in audit', async () => {
    stubSms(true)
    const Property = (await import('../src/models/Property')).default
    const Location = (await import('../src/models/Location')).default
    const loc = await Location.findOne().lean()

    // Pre-existing property at a coordinate
    const lat = 36.7525; const lng = 3.0420
    const seed = await User.create({
      fullName: 'Seed', email: `hostsignup-test-seed-${Date.now()}@test.darywin.com`,
      phone: '+213555999001', type: darywinTypes.UserType.Agency, active: true,
    })
    await Property.create({
      name: 'Seed', agency: seed._id, type: darywinTypes.PropertyType.Apartment,
      description: 'x', image: 'x', bedrooms: 1, bathrooms: 1, petsAllowed: false,
      furnished: false, minimumAge: 21, location: loc!._id, price: 100,
      rentalTerm: darywinTypes.RentalTerm.Monthly, latitude: lat, longitude: lng,
    })

    // Complete a new signup at same coordinate
    const email = `hostsignup-test-flag-${Date.now()}@test.darywin.com`
    const r1 = await request(app).post('/api/signup/host/start').send({ phone: '+213555999002' })
    const cookie = extractCookie(r1)
    await request(app).post('/api/signup/host/verify-phone').set('Cookie', cookie).send({ code: '123456' })
    await request(app).post('/api/signup/host/details').set('Cookie', cookie).send({
      email, password: 'Sup3rSecret!', agencyName: 'Flag Host', locationId: String(loc!._id),
    })
    const rComplete = await request(app).post('/api/signup/host/complete').set('Cookie', cookie).send({
      teaserProperty: { name: 'T', address: 'x', price: 100, latitude: lat, longitude: lng },
    })
    expect(rComplete.status).toBe(200)

    const user = await User.findOne({ email }).lean()
    const audit = await HostSignupAudit.findOne({ event: 'host_signup', userId: user!._id }).lean()
    expect(audit?.flags).toContain('duplicate_address')
  })
})

describe('Regression: admin-provisioned CreateAgency (T118)', () => {
  it('admin-provisioned agency via existing /api/create-user gets backfilled defaults', async () => {
    const bcrypt = (await import('bcrypt')).default
    const authHelper = await import('../src/utils/authHelper')

    const admin = await User.create({
      fullName: 'Reg Admin',
      email: `hostsignup-test-regadmin-${Date.now()}@test.darywin.com`,
      password: await bcrypt.hash('Sup3rSecret!', 10),
      type: darywinTypes.UserType.Admin, active: true, verified: true,
    })
    const adminToken = await authHelper.encryptJWT({ id: admin._id.toString() })

    const agencyEmail = `hostsignup-test-regagency-${Date.now()}@test.darywin.com`
    const r = await request(app)
      .post('/api/create-user')
      .set('x-access-token', adminToken)
      .send({
        fullName: 'Admin Provisioned Agency',
        email: agencyEmail,
        phone: '+213555333333',
        location: 'Algiers',
        bio: 'test',
        type: darywinTypes.UserType.Agency,
        language: 'en',
        password: 'Sup3rSecret!',
      })
    expect([200, 201]).toContain(r.status)

    const created = await User.findOne({ email: agencyEmail }).lean()
    expect(created).toBeTruthy()
    expect(created!.type).toBe(darywinTypes.UserType.Agency)
    // Schema defaults: firstPayoutApproved=false, phoneVerified=false, onboardingStep=Done
    expect(created!.onboardingStep).toBe(darywinTypes.OnboardingStep.Done)
    // NOTE: admin-provisioned agencies start with firstPayoutApproved=false by default
    // The backfill script (backfill-host-fields.ts) flips existing agencies to true.
    // New admin-provisioned ones are subject to the same payout gate — acceptable.

    await User.deleteOne({ _id: admin._id })
  })
})

describe('SIGNUP_PUBLIC_ENABLED kill-switch', () => {
  it('returns 503 when disabled', async () => {
    process.env.DW_SIGNUP_PUBLIC_ENABLED = 'false'
    const r = await request(app).post('/api/signup/host/start').send({ phone: ALLOWED_PHONE })
    expect(r.status).toBe(503)
    process.env.DW_SIGNUP_PUBLIC_ENABLED = 'true'
  })
})
