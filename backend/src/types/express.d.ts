import type { Types } from 'mongoose'
import type * as darywinTypes from ':darywin-types'

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId
        type: darywinTypes.UserType
      }
      tenantFilter?: {
        agency?: Types.ObjectId
      }
    }
  }
}

export {}
