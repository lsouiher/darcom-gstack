import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import * as darywinTypes from ':darywin-types'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as authHelper from '../utils/authHelper'
import * as logger from '../utils/logger'
import User from '../models/User'

/**
 * Verify authentication token middleware.
 *
 * On success, populates `req.user` with `{ _id, type }` from a fresh DB read.
 * Re-fetching on every request enforces role freshness (closes the
 * multi-tab role-change attack window).
 */
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  let token: string
  const isAdmin = authHelper.isAdmin(req)
  const isFrontend = authHelper.isFrontend(req)

  if (isAdmin) {
    token = req.signedCookies[env.ADMIN_AUTH_COOKIE_NAME] as string
  } else if (isFrontend) {
    token = req.signedCookies[env.FRONTEND_AUTH_COOKIE_NAME] as string
  } else {
    token = req.headers[env.X_ACCESS_TOKEN] as string
  }

  if (!token) {
    res.status(403).send({ message: 'No token provided!' })
    return
  }

  try {
    const sessionData = await authHelper.decryptJWT(token)

    if (!sessionData || !helper.isValidObjectId(sessionData.id)) {
      logger.info('Token not valid: bad session data')
      res.status(401).send({ message: 'Unauthorized!' })
      return
    }

    const $match: mongoose.QueryFilter<env.User> = {
      $and: [{ _id: sessionData.id }],
    }
    if (isAdmin) {
      $match.$and?.push({ type: { $in: [darywinTypes.UserType.Admin, darywinTypes.UserType.Agency] } })
    } else if (isFrontend) {
      $match.$and?.push({ type: darywinTypes.UserType.User })
    }

    const user = await User.findOne($match).select('_id type').lean()

    if (!user) {
      logger.info('Token not valid: User not found')
      res.status(401).send({ message: 'Unauthorized!' })
      return
    }

    req.user = {
      _id: user._id as mongoose.Types.ObjectId,
      type: user.type as darywinTypes.UserType,
    }

    next()
  } catch (err) {
    logger.info('Token not valid', err)
    res.status(401).send({ message: 'Unauthorized!' })
  }
}

export default { verifyToken }
