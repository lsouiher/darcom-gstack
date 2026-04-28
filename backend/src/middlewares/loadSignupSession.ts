import type { Request, Response, NextFunction } from 'express'
import HostSignupSession, { type HostSignupSessionDoc } from '../models/HostSignupSession'
import { verifySessionCookie, SIGNUP_COOKIE_NAME } from '../utils/signupSession'

declare module 'express-serve-static-core' {
  interface Request {
    signupSession?: HostSignupSessionDoc
  }
}

export const loadSignupSession = async (req: Request, res: Response, next: NextFunction) => {
  const cookie = req.cookies?.[SIGNUP_COOKIE_NAME] as string | undefined
  const sessionId = verifySessionCookie(cookie)
  if (!sessionId) {
    return res.status(401).json({ code: 'SESSION_INVALID' })
  }
  const session = await HostSignupSession.findById(sessionId)
  if (!session) {
    return res.status(401).json({ code: 'SESSION_EXPIRED' })
  }
  if (session.completed) {
    return res.status(410).json({ code: 'SESSION_COMPLETED' })
  }
  req.signupSession = session
  return next()
}
