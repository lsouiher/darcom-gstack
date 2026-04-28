import type { Request, Response, NextFunction } from 'express'

const enabled = (): boolean => {
  const raw = (process.env.DW_SIGNUP_PUBLIC_ENABLED || 'true').toLowerCase()
  return raw !== 'false' && raw !== '0'
}

export const signupEnabledGuard = (_req: Request, res: Response, next: NextFunction) => {
  if (!enabled()) {
    return res.status(503).json({ code: 'SIGNUP_CLOSED' })
  }
  return next()
}
