import crypto from 'node:crypto'
import type { Request } from 'express'
import { Types } from 'mongoose'
import HostSignupAudit, { type HostSignupAuditEvent } from '../models/HostSignupAudit'
import * as env from '../config/env.config'
import { fireAndForget } from './fireAndForget'

export const hashPhone = (phone: string): string =>
  crypto.createHmac('sha256', env.AUDIT_PEPPER).update(phone).digest('hex')

export interface WriteAuditInput {
  event: HostSignupAuditEvent
  userId?: string | Types.ObjectId
  phone?: string
  flags?: string[]
  req?: Request
  reason?: string
}

const successEvents: HostSignupAuditEvent[] = ['host_signup']

export const writeAudit = (input: WriteAuditInput): void => {
  const isSuccess = successEvents.includes(input.event)
  const doc: Record<string, unknown> = {
    event: input.event,
    userId: input.userId,
    flags: input.flags,
    reason: input.reason,
    ip: input.req?.ip,
    ua: input.req?.headers['user-agent'],
  }
  if (input.phone) {
    if (isSuccess) doc.phone = input.phone
    else doc.phoneHash = hashPhone(input.phone)
  }
  fireAndForget(`audit:${input.event}`, HostSignupAudit.create(doc))
}
