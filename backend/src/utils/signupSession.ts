import crypto from 'node:crypto'
import * as env from '../config/env.config'

export const SIGNUP_COOKIE_NAME = 'dw-signup-session'

const sign = (value: string): string => {
  const h = crypto.createHmac('sha256', env.SIGNUP_SESSION_SECRET).update(value).digest('base64url')
  return `${value}.${h}`
}

export const signSessionId = (sessionId: string): string => {
  const payload = `${sessionId}:${Date.now()}`
  return sign(Buffer.from(payload).toString('base64url'))
}

export const verifySessionCookie = (raw: string | undefined): string | null => {
  if (!raw) return null
  const [body, sig] = raw.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', env.SIGNUP_SESSION_SECRET).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const decoded = Buffer.from(body, 'base64url').toString('utf8')
    const [sessionId, tsRaw] = decoded.split(':')
    const ts = Number.parseInt(tsRaw, 10)
    if (!sessionId || Number.isNaN(ts)) return null
    const ageSec = (Date.now() - ts) / 1000
    if (ageSec > env.SIGNUP_SESSION_TTL) return null
    return sessionId
  } catch {
    return null
  }
}

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.HTTPS,
  sameSite: 'lax' as const,
  maxAge: env.SIGNUP_SESSION_TTL * 1000,
  domain: env.AUTH_COOKIE_DOMAIN,
  path: '/',
})
