import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import * as darywinTypes from ':darywin-types'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as env from '../src/config/env.config'
import User from '../src/models/User'
import authJwt from '../src/middlewares/authJwt'
import * as authHelper from '../src/utils/authHelper'
import * as testHelper from './testHelper'

const buildApp = () => {
  const app = express()
  app.use(cookieParser(env.COOKIE_SECRET))
  app.get('/me', authJwt.verifyToken, (req: Request, res: Response) => {
    res.status(200).json({
      id: req.user?._id?.toString() ?? null,
      type: req.user?.type ?? null,
    })
  })
  return app
}

let app: express.Express
let agencyId: string

beforeAll(async () => {
  testHelper.initializeLogger()
  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()
  agencyId = await testHelper.createAgency(testHelper.GetRandomEmail(), 'agency-authjwt')
  app = buildApp()
})

afterAll(async () => {
  await testHelper.deleteAgency(agencyId)
  await testHelper.close()
  await databaseHelper.close()
})

const signJwt = (id: string) => authHelper.encryptJWT({ id })

describe('authJwt.verifyToken populates req.user', () => {
  it('valid token → req.user populated with _id and type', async () => {
    const token = await signJwt(agencyId)
    const res = await request(app)
      .get('/me')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe(agencyId)
    expect(res.body.type).toBe(darywinTypes.UserType.Agency)
  })

  it('user deleted after token issue → 401', async () => {
    const tempId = await testHelper.createAgency(testHelper.GetRandomEmail(), 'agency-deleted')
    const token = await signJwt(tempId)
    await User.deleteOne({ _id: tempId })
    const res = await request(app)
      .get('/me')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(401)
  })

  it('user type changed in DB → req.user reflects fresh type', async () => {
    const token = await signJwt(agencyId)
    await User.updateOne({ _id: agencyId }, { $set: { type: darywinTypes.UserType.Admin } })
    const res = await request(app)
      .get('/me')
      .set(env.X_ACCESS_TOKEN, token)
    expect(res.statusCode).toBe(200)
    expect(res.body.type).toBe(darywinTypes.UserType.Admin)
    await User.updateOne({ _id: agencyId }, { $set: { type: darywinTypes.UserType.Agency } })
  })

  it('no token → 403', async () => {
    const res = await request(app).get('/me')
    expect(res.statusCode).toBe(403)
  })

  it('malformed token → 401', async () => {
    const res = await request(app).get('/me').set(env.X_ACCESS_TOKEN, 'not-a-jwt')
    expect(res.statusCode).toBe(401)
  })
})
