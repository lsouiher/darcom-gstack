import rateLimit, { type Options } from 'express-rate-limit'
import type { Request } from 'express'

const base = (overrides: Partial<Options>) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    ...overrides,
  })

export const ipLimiter = (max: number, windowMs = 15 * 60 * 1000) =>
  base({ max, windowMs })

export const phoneLimiter = (max: number, windowMs = 60 * 60 * 1000) =>
  base({
    max,
    windowMs,
    keyGenerator: (req: Request) => {
      const phone = (req.body && (req.body as { phone?: string }).phone) || ''
      return phone ? `phone:${phone}` : `ip:${req.ip}`
    },
  })

export const signupStartLimiter = ipLimiter(10, 15 * 60 * 1000)
export const signupPhoneLimiter = phoneLimiter(5, 60 * 60 * 1000)
export const signupVerifyLimiter = ipLimiter(20, 15 * 60 * 1000)
export const signupDetailsLimiter = ipLimiter(15, 15 * 60 * 1000)
export const signupCompleteLimiter = ipLimiter(5, 15 * 60 * 1000)
export const signupTokenLimiter = ipLimiter(5, 15 * 60 * 1000)
