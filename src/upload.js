import multer from 'multer'
import path from 'path'
import { uploadDir } from './db.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '')}`
    cb(null, safeName)
  }
})

export const upload = multer({ storage })
export const uploadMemory = multer({ storage: multer.memoryStorage() })