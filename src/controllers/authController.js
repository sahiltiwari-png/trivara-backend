import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })
  const user = await User.findOne({ email }).lean()
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(String(password), user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const secret = process.env.JWT_SECRET || 'dev_secret'
  const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, secret, { expiresIn: '1d' })
  res.json({ token })
}