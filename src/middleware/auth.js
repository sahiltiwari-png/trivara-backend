import jwt from 'jsonwebtoken'

function getToken(req) {
  const h = req.headers['authorization'] || ''
  if (typeof h === 'string' && h.startsWith('Bearer ')) return h.slice(7)
  return null
}

export function authenticate(req, res, next) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret'
    const payload = jwt.verify(token, secret)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req, res, next) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret'
    const payload = jwt.verify(token, secret)
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin role required' })
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}