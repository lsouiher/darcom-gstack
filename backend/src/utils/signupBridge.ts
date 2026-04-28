import type { CookieOptions } from 'express'
import * as env from '../config/env.config'

export const BRIDGE_COOKIE_NAME = 'dw-host-signup-bridge'
export const BRIDGE_TOKEN_TTL_SECONDS = 120

export const bridgeCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.HTTPS,
  signed: true,
  sameSite: 'strict',
  domain: env.AUTH_COOKIE_DOMAIN,
  path: '/',
  maxAge: BRIDGE_TOKEN_TTL_SECONDS * 1000,
})
