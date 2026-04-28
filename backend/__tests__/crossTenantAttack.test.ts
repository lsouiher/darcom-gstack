import 'dotenv/config'
import request from 'supertest'
import mongoose from 'mongoose'
import * as darywinTypes from ':darywin-types'
import * as databaseHelper from '../src/utils/databaseHelper'
import app from '../src/app'
import * as env from '../src/config/env.config'
import * as authHelper from '../src/utils/authHelper'
import Property from '../src/models/Property'
import * as testHelper from './testHelper'

let AGENCY_A: string
let AGENCY_B: string
let PROPERTY_B_ID: string
let tokenA: string
let tokenB: string

beforeAll(async () => {
  testHelper.initializeLogger()
  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()

  AGENCY_A = await testHelper.createAgency(testHelper.GetRandomEmail(), 'agency-a')
  AGENCY_B = await testHelper.createAgency(testHelper.GetRandomEmail(), 'agency-b')

  tokenA = await authHelper.encryptJWT({ id: AGENCY_A })
  tokenB = await authHelper.encryptJWT({ id: AGENCY_B })

  // Insert a property owned by AGENCY_B directly (skip image flow).
  const prop = await new Property({
    name: 'B-owned',
    type: darywinTypes.PropertyType.House,
    agency: new mongoose.Types.ObjectId(AGENCY_B),
    description: 'x',
    image: 'unused.jpg',
    bedrooms: 1,
    bathrooms: 1,
    kitchens: 1,
    parkingSpaces: 0,
    size: 50,
    petsAllowed: false,
    furnished: false,
    minimumAge: 21,
    location: new mongoose.Types.ObjectId(),
    address: 'x',
    latitude: 0,
    longitude: 0,
    price: 100,
    hidden: false,
    cancellation: 0,
    aircon: false,
    rentalTerm: darywinTypes.RentalTerm.Daily,
    available: true,
  }).save()
  PROPERTY_B_ID = prop._id.toString()
})

afterAll(async () => {
  await Property.deleteOne({ _id: PROPERTY_B_ID })
  await testHelper.deleteAgency(AGENCY_A)
  await testHelper.deleteAgency(AGENCY_B)
  await testHelper.close()
  await databaseHelper.close()
})

describe('cross-tenant attack surface', () => {
  it('agency A cannot update agency B\'s property (ownership check → 403)', async () => {
    const res = await request(app)
      .put('/api/update-property')
      .set(env.X_ACCESS_TOKEN, tokenA)
      .send({
        _id: PROPERTY_B_ID,
        name: 'hijacked-by-A',
        type: darywinTypes.PropertyType.House,
        agency: AGENCY_A,
        description: 'x',
        bedrooms: 1,
        bathrooms: 1,
        kitchens: 1,
        parkingSpaces: 0,
        size: 50,
        petsAllowed: false,
        furnished: false,
        minimumAge: 21,
        location: new mongoose.Types.ObjectId().toString(),
        address: 'x',
        latitude: 0,
        longitude: 0,
        price: 100,
        hidden: false,
        cancellation: 0,
        aircon: false,
        rentalTerm: darywinTypes.RentalTerm.Daily,
      })
    expect(res.statusCode).toBe(403)

    const still = await Property.findById(PROPERTY_B_ID)
    expect(still?.name).toBe('B-owned')
  })

  it('agency A cannot delete agency B\'s property', async () => {
    const res = await request(app)
      .delete(`/api/delete-property/${PROPERTY_B_ID}`)
      .set(env.X_ACCESS_TOKEN, tokenA)
    expect(res.statusCode).toBe(403)
    const still = await Property.findById(PROPERTY_B_ID)
    expect(still).not.toBeNull()
  })

  it('agency A querying properties with spoofed agencies=[B] returns only own', async () => {
    const res = await request(app)
      .post('/api/properties/1/30')
      .set(env.X_ACCESS_TOKEN, tokenA)
      .send({
        agencies: [AGENCY_B],
        types: [darywinTypes.PropertyType.House],
        rentalTerms: [darywinTypes.RentalTerm.Daily],
      })
    expect(res.statusCode).toBe(200)
    const results = res.body?.[0]?.resultData ?? []
    for (const p of results) {
      expect(String(p.agency?._id ?? p.agency)).not.toBe(AGENCY_B)
    }
  })

  it('agency A cannot update agency B\'s profile', async () => {
    const res = await request(app)
      .put('/api/update-agency')
      .set(env.X_ACCESS_TOKEN, tokenA)
      .send({ _id: AGENCY_B, fullName: 'hijacked', phone: '', location: '', bio: '', payLater: true })
    expect(res.statusCode).toBe(403)
  })

  it('agency B can update its own property (control)', async () => {
    const res = await request(app)
      .put('/api/update-property')
      .set(env.X_ACCESS_TOKEN, tokenB)
      .send({
        _id: PROPERTY_B_ID,
        name: 'B-owned',
        type: darywinTypes.PropertyType.House,
        agency: AGENCY_B,
        description: 'x',
        bedrooms: 1,
        bathrooms: 1,
        kitchens: 1,
        parkingSpaces: 0,
        size: 50,
        petsAllowed: false,
        furnished: false,
        minimumAge: 21,
        location: new mongoose.Types.ObjectId().toString(),
        address: 'x',
        latitude: 0,
        longitude: 0,
        price: 100,
        hidden: false,
        cancellation: 0,
        aircon: false,
        rentalTerm: darywinTypes.RentalTerm.Daily,
      })
    expect([200, 204]).toContain(res.statusCode)
  })
})
