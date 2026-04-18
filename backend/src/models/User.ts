import validator from 'validator'
import { Schema, model } from 'mongoose'
import * as darywinTypes from ':darywin-types'
import * as env from '../config/env.config'

export const USER_EXPIRE_AT_INDEX_NAME = 'expireAt'

const userSchema = new Schema<env.User>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      validate: [validator.isEmail, 'is not valid'],
      index: true,
      trim: true,
    },
    phone: {
      type: String,
      validate: {
        validator: (value: string): boolean => {
          // Check if value is empty then return true.
          if (!value) {
            return true
          }

          // If value is empty will not validate for mobile phone.
          return validator.isMobilePhone(value)
        },
        message: '{VALUE} is not valid',
      },
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    birthDate: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: false,
    },
    language: {
      // ISO 639-1 (alpha-2 code)
      type: String,
      default: env.DEFAULT_LANGUAGE,
      lowercase: true,
      minlength: 2,
      maxlength: 2,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [darywinTypes.UserType.Admin, darywinTypes.UserType.Agency, darywinTypes.UserType.User],
      default: darywinTypes.UserType.User,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
    payLater: {
      type: Boolean,
      default: true,
    },
    customerId: {
      type: String,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    firstPayoutApproved: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: String,
      enum: [
        darywinTypes.OnboardingStep.Phone,
        darywinTypes.OnboardingStep.Email,
        darywinTypes.OnboardingStep.Details,
        darywinTypes.OnboardingStep.Property,
        darywinTypes.OnboardingStep.Payout,
        darywinTypes.OnboardingStep.Done,
      ],
      default: darywinTypes.OnboardingStep.Done,
    },
    payoutAccountId: {
      type: String,
    },
    expireAt: {
      //
      // Non verified and active users created from checkout with Stripe are temporary and
      // are automatically deleted if the payment checkout session expires.
      //
      type: Date,
      index: { name: USER_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.USER_EXPIRE_AT, background: true },
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'User',
  },
)

userSchema.index({ type: 1, expireAt: 1, fullName: 1 })
userSchema.index({ type: 1, expireAt: 1, email: 1 })
userSchema.index({ type: 1, expireAt: 1, fullName: 1, _id: 1 })
userSchema.index({ type: 1, expireAt: 1, email: 1, _id: 1 })
userSchema.index({ type: 1, firstPayoutApproved: 1 })
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string', $gt: '' }, type: 'AGENCY' } },
)

const User = model<env.User>('User', userSchema)

export default User
