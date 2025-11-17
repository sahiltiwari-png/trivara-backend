import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from './models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trivara'
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'trivara' })
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
  const email = process.env.ADMIN_EMAIL || 'admin@trivara.com'
  const password = process.env.ADMIN_PASSWORD || ''
  const admin = await User.findOne({ email }).lean()
  if (!admin) {
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined
    await User.create({ email, role: 'admin', passwordHash })
    console.log(`Admin user ensured: ${email}`)
  } else if (password) {
    const passwordHash = await bcrypt.hash(password, 10)
    await User.updateOne({ email }, { $set: { passwordHash } })
    console.log(`Admin password updated for: ${email}`)
  } else {
    console.log(`Admin user present: ${email}`)
  }
}