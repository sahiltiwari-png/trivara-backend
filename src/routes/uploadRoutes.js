import { Router } from 'express'
import { upload, uploadMemory } from '../upload.js'
import { uploadSingleLegacy } from '../controllers/uploadController.js'

const isS3Configured = () => {
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  return !!bucket && !!accessKeyId && !!secretAccessKey
}

export function uploadRoutes() {
  const r = Router()
  r.post('/', isS3Configured() ? uploadMemory.single('file') : upload.single('file'), uploadSingleLegacy)
  return r
}