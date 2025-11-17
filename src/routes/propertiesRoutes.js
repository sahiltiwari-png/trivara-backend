import { Router } from 'express'
import { upload } from '../upload.js'
import { requireAdmin } from '../middleware/auth.js'
import { listProperties, getProperty, createProperty, updateProperty, deleteProperty } from '../controllers/propertiesController.js'

export function propertiesRoutes() {
  const r = Router()
  r.get('/', listProperties)
  r.get('/:id', getProperty)
  r.post('/', requireAdmin, upload.array('images', 10), createProperty)
  r.put('/:id', requireAdmin, upload.array('images', 10), updateProperty)
  r.delete('/:id', requireAdmin, deleteProperty)
  return r
}
