import { Request } from 'express'
import { jwtVerify, SignJWT } from 'jose'
import bcrypt from 'bcrypt'
import axios from 'axios'
import * as helper from './helper'
import * as env from '../config/env.config'
import * as darywinTypes from ':darywin-types'

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET)
const jwtAlg = 'HS256'

const PURPOSE_HOST_SIGNUP = 'host-signup' as const
export type TokenPurpose = typeof PURPOSE_HOST_SIGNUP

export type SessionData = {
  id: string
}

export type PurposeBoundPayload = {
  id: string
  purpose: TokenPurpose
  iat: number
}

/**
 * Sign and return a session JWT. Session tokens never carry a `purpose`
 * claim — the verifier rejects them if they do.
 */
export const encryptJWT = async (payload: SessionData, stayConnected?: boolean) => {
  const jwt = await new SignJWT({ id: payload.id })
    .setProtectedHeader({ alg: jwtAlg })
    .setIssuedAt()

  if (!stayConnected) {
    jwt.setExpirationTime(`${env.JWT_EXPIRE_AT} seconds`)
  }

  return jwt.sign(jwtSecret)
}

/**
 * Verify a session JWT. Defense-in-depth: rejects any token that carries a
 * `purpose` claim so a leaked purpose-bound token (e.g. host-signup bridge)
 * cannot be replayed as a session cookie.
 */
export const decryptJWT = async (input: string): Promise<SessionData> => {
  const { payload } = await jwtVerify(input, jwtSecret, {
    algorithms: [jwtAlg],
  })
  if ((payload as { purpose?: unknown }).purpose !== undefined) {
    throw new Error('purpose-bound token rejected by session verifier')
  }
  return { id: (payload as { id: string }).id }
}

/**
 * Sign a short-lived purpose-bound token. Used for the host-signup admin
 * handoff; never accepted by the session verifier above.
 */
export const signPurposeToken = async (
  payload: { id: string; purpose: TokenPurpose },
  ttlSeconds: number,
) =>
  new SignJWT({ id: payload.id, purpose: payload.purpose })
    .setProtectedHeader({ alg: jwtAlg })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds} seconds`)
    .sign(jwtSecret)

/**
 * Verify a purpose-bound token. Rejects if the token is missing the
 * `purpose` claim or doesn't match the expected purpose. Returns `iat`
 * so callers can enforce one-time use against a stored consumed-at marker.
 */
export const verifyPurposeToken = async (
  input: string,
  expectedPurpose: TokenPurpose,
): Promise<PurposeBoundPayload> => {
  const { payload } = await jwtVerify(input, jwtSecret, {
    algorithms: [jwtAlg],
  })
  const p = payload as { id?: unknown; purpose?: unknown; iat?: unknown }
  if (typeof p.id !== 'string' || !p.id) {
    throw new Error('purpose-bound token missing id')
  }
  if (p.purpose !== expectedPurpose) {
    throw new Error('purpose-bound token mismatch')
  }
  if (typeof p.iat !== 'number') {
    throw new Error('purpose-bound token missing iat')
  }
  return { id: p.id, purpose: expectedPurpose, iat: p.iat }
}

/**
 * Check whether the request is from the admin or not.
 *
 * @export
 * @param {Request} req
 * @returns {boolean}
 */
export const isAdmin = (req: Request): boolean => !!req.headers.origin && helper.trimEnd(req.headers.origin, '/') === helper.trimEnd(env.ADMIN_HOST, '/')

/**
 * Check whether the request is from the frontend or not.
 *
 * @export
 * @param {Request} req
 * @returns {boolean}
 */
export const isFrontend = (req: Request): boolean => !!req.headers.origin && helper.trimEnd(req.headers.origin, '/') === helper.trimEnd(env.FRONTEND_HOST, '/')

/**
 * Get authentification cookie name.
 *
 * @param {Request} req
 * @returns {string}
 */
export const getAuthCookieName = (req: Request): string => {
  if (isAdmin(req)) {
    // Admin auth cookie name
    return env.ADMIN_AUTH_COOKIE_NAME
  }

  if (isFrontend(req)) {
    // Frontend auth cookie name
    return env.FRONTEND_AUTH_COOKIE_NAME
  }

  // Mobile app and unit tests auth header name
  return env.X_ACCESS_TOKEN
}

/**
 * Hash password using bcrypt.
 *
 * @async
 * @param {string} password 
 * @returns {Promise<string>} 
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Parse JWT token.
 *
 * @param {string} token
 * @returns {any}
 */
export const parseJwt = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())

/**
 * Validate JWT token structure.
 *
 * @param {string} token
 * @returns {boolean}
 */
export const validateAccessToken = async (socialSignInType: darywinTypes.SocialSignInType, token: string, email: string) => {
  if (socialSignInType === darywinTypes.SocialSignInType.Facebook) {
    try {
      parseJwt(token)
      return true
    } catch {
      return false
    }
  }

  if (socialSignInType === darywinTypes.SocialSignInType.Apple) {
    try {
      const res = parseJwt(token)
      return res.email === email
    } catch {
      return false
    }
  }

  if (socialSignInType === darywinTypes.SocialSignInType.Google) {
    try {
      const res = await axios.get(
        'https://www.googleapis.com/oauth2/v3/tokeninfo',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      return res.data.email === email
    } catch {
      return false
    }
  }

  return false
}
