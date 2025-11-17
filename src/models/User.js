import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    passwordHash: { type: String },
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model('User', userSchema)