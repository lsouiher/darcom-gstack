import { Schema, model, Document, Types } from 'mongoose'

export type HostSignupAuditEvent =
  | 'host_signup'
  | 'otp_failed'
  | 'otp_send_failed'
  | 'phone_collision'
  | 'email_collision'
  | 'duplicate_signup'
  | 'rate_limited'
  | 'country_blocked'

export interface HostSignupAuditDoc extends Document {
  event: HostSignupAuditEvent
  userId?: Types.ObjectId
  phone?: string
  phoneHash?: string
  flags?: string[]
  ip?: string
  ua?: string
  reason?: string
  createdAt: Date
}

const schema = new Schema<HostSignupAuditDoc>(
  {
    event: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    phone: String,
    phoneHash: String,
    flags: [String],
    ip: String,
    ua: String,
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'HostSignupAudit' },
)

schema.index({ createdAt: -1 })
schema.index({ userId: 1, createdAt: -1 })

export default model<HostSignupAuditDoc>('HostSignupAudit', schema)
