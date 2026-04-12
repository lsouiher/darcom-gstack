import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as darywinTypes from ':darywin-types'
import User from '../models/User'

// C24: single aggregation with $lookup — no per-agency loop.
export const listPendingReviewAgencies = async (_req: Request, res: Response) => {
  const rows = await User.aggregate([
    { $match: { type: darywinTypes.UserType.Agency, firstPayoutApproved: false } },
    {
      $lookup: {
        from: 'HostSignupAudit',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$userId', '$$userId'] }, event: 'host_signup' } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { flags: 1 } },
        ],
        as: 'audit',
      },
    },
    {
      $project: {
        _id: 1,
        fullName: 1,
        email: 1,
        phone: 1,
        createdAt: 1,
        firstPayoutApproved: 1,
        flags: { $ifNull: [{ $arrayElemAt: ['$audit.flags', 0] }, []] },
      },
    },
    { $sort: { createdAt: -1 } },
  ])
  return res.status(200).json(rows)
}

export const approveFirstPayout = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ code: 'INVALID_ID' })
  }
  const user = await User.findOneAndUpdate(
    { _id: id, type: darywinTypes.UserType.Agency },
    { $set: { firstPayoutApproved: true } },
    { new: true },
  ).select('_id firstPayoutApproved').lean()
  if (!user) {
    return res.status(404).json({ code: 'NOT_FOUND' })
  }
  return res.status(200).json({ _id: String(user._id), firstPayoutApproved: user.firstPayoutApproved })
}

// Exported for future payout-release integration (T042 forward-looking gate).
export const isPayoutAllowed = async (userId: string): Promise<boolean> => {
  const u = await User.findById(userId).select('firstPayoutApproved type').lean()
  if (!u) return false
  if (u.type !== darywinTypes.UserType.Agency) return true
  return !!u.firstPayoutApproved
}
