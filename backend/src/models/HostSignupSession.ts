import { Schema, model, Document, Types } from 'mongoose'
import * as darywinTypes from ':darywin-types'

export interface HostSignupSessionDoc extends Document {
  _id: Types.ObjectId
  phone: string
  country?: string
  channel?: darywinTypes.OtpChannel
  phoneVerified: boolean
  otpAttempts: number
  email?: string
  passwordHash?: string
  agencyName?: string
  locationId?: Types.ObjectId
  language: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

const schema = new Schema<HostSignupSessionDoc>(
  {
    phone: { type: String, required: true, index: true },
    country: String,
    channel: { type: String, enum: [darywinTypes.OtpChannel.WhatsApp, darywinTypes.OtpChannel.SMS] },
    phoneVerified: { type: Boolean, default: false },
    otpAttempts: { type: Number, default: 0 },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: String,
    agencyName: String,
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    language: { type: String, default: 'en' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'HostSignupSession' },
)

schema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 })

export default model<HostSignupSessionDoc>('HostSignupSession', schema)
