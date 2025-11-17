import { Router } from 'express'
import { login } from '../controllers/authController.js'

export function authRoutes() {
  const r = Router()
  r.post('/login', login)
  return r
}