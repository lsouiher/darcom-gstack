import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import mongoose from 'mongoose'
import * as darywinTypes from ':darywin-types'
import { tenantScope, markHandler } from '../src/middlewares/tenantScope'
import * as accessLog from '../src/observability/tenantAccessLog'
import * as testHelper from './testHelper'

type FakeUserType = { _id: mongoose.Types.ObjectId; type: darywinTypes.UserType }

const injectUser = (user?: FakeUserType) => (req: Request, _res: Response, next: NextFunction) => {
  if (user) req.user = user
  next()
}

const buildApp = (marker: 'AdminOnly' | 'TenantScoped' | 'Public' | 'none', user?: FakeUserType) => {
  const app = express()
  const handler = (req: Request, res: Response) => res.status(200).json({ filter: req.tenantFilter ?? null })
  const marked = marker === 'none' ? handler : markHandler(handler, marker)
  app.get('/r', injectUser(user), tenantScope, marked)
  return app
}

beforeAll(() => {
  testHelper.initializeLogger()
})

beforeEach(() => {
  accessLog.resetCounters()
})

describe('tenantScope middleware', () => {
  const agencyId = new mongoose.Types.ObjectId()
  const adminUser: FakeUserType = { _id: new mongoose.Types.ObjectId(), type: darywinTypes.UserType.Admin }
  const agencyUser: FakeUserType = { _id: agencyId, type: darywinTypes.UserType.Agency }

  it('admin passes @AdminOnly', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('AdminOnly', adminUser)).get('/r')
    expect(res.statusCode).toBe(200)
  })

  it('agency rejected on @AdminOnly with 403', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('AdminOnly', agencyUser)).get('/r')
    expect(res.statusCode).toBe(403)
  })

  it('agency scoped on @TenantScoped injects agency filter', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('TenantScoped', agencyUser)).get('/r')
    expect(res.statusCode).toBe(200)
    expect(res.body.filter).toEqual({ agency: agencyId.toString() })
  })

  it('admin on @TenantScoped gets empty filter (sees all)', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('TenantScoped', adminUser)).get('/r')
    expect(res.statusCode).toBe(200)
    expect(res.body.filter).toEqual({})
  })

  it('@Public passes without user', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('Public')).get('/r')
    expect(res.statusCode).toBe(200)
  })

  it('no marker + strict → 403 default-deny', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('none', agencyUser)).get('/r')
    expect(res.statusCode).toBe(403)
  })

  it('no marker + warn → pass with log', async () => {
    process.env.DW_TENANT_ENFORCE = 'warn'
    const res = await request(buildApp('none', agencyUser)).get('/r')
    expect(res.statusCode).toBe(200)
  })

  it('missing req.user on authenticated route → 500', async () => {
    process.env.DW_TENANT_ENFORCE = 'strict'
    const res = await request(buildApp('AdminOnly')).get('/r')
    expect(res.statusCode).toBe(500)
  })

  it('env=off bypasses enforcement', async () => {
    process.env.DW_TENANT_ENFORCE = 'off'
    const res = await request(buildApp('none', agencyUser)).get('/r')
    expect(res.statusCode).toBe(200)
  })
})
