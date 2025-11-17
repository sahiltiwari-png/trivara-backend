import { Router } from 'express'
import { upload, uploadMemory } from '../upload.js'
import { uploadSingleLegacy, uploadMultipleLegacy } from '../controllers/uploadController.js'

const isS3Configured = () => {
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  return !!bucket && !!accessKeyId && !!secretAccessKey
}

const handleMulter = (mw) => (req, res, next) => {
  mw(req, res, (err) => {
    if (err) {
      const code = err.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 400
      return res.status(code).json({ error: 'Upload error', message: err.message })
    }
    next()
  })
}

export function legacyUploadRoutes() {
  const r = Router()

  r.post(
    '/upload',
    handleMulter(isS3Configured() ? uploadMemory.single('file') : upload.single('file')),
    uploadSingleLegacy
  )

  r.post(
    '/upload-multiple',
    handleMulter(isS3Configured() ? uploadMemory.array('files', 10) : upload.array('files', 10)),
    uploadMultipleLegacy
  )

  return r
}