import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { listQueries, getQuery, createQuery } from '../controllers/queriesController.js'

export function queriesRoutes() {
  const r = Router()
  r.get('/', requireAdmin, listQueries)
  r.get('/:id', requireAdmin, getQuery)
  r.post('/', createQuery)
  return r
}
