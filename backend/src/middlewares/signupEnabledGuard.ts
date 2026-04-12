import type { Request, Response, NextFunction } from 'express'
import * as env from '../config/env.config'

export const signupEnabledGuard = (_req: Request, res: Response, next: NextFunction) => {
  if (!env.SIGNUP_PUBLIC_ENABLED) {
    return res.status(503).json({ code: 'SIGNUP_CLOSED' })
  }
  return next()
}
