import mongoose from 'mongoose'
import * as env from '../config/env.config.js'
import * as darywinTypes from ':darywin-types'
import User from '../models/User.js'
import * as logger from '../utils/logger.js'

const run = async () => {
  await mongoose.connect(env.DB_URI)
  logger.info('[backfill-host-fields] connected')

  const result = await User.updateMany(
    { type: darywinTypes.UserType.Agency },
    {
      $set: {
        phoneVerified: true,
        firstPayoutApproved: true,
        onboardingStep: darywinTypes.OnboardingStep.Done,
      },
    },
  )

  logger.info(`[backfill-host-fields] matched=${result.matchedCount} modified=${result.modifiedCount}`)
  await mongoose.disconnect()
}

run().catch((err) => {
  logger.error('[backfill-host-fields] failed', err)
  process.exit(1)
})
