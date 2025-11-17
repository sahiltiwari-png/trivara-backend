import path from 'path'
import { uploadToS3 } from '../services/s3.js'

const isS3Configured = () => {
  const bucket =  process.env.S3_BUCKET_NAME || ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  return !!bucket && !!accessKeyId && !!secretAccessKey
}

export async function uploadImage(req, res) {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file provided' })
  const ext = path.extname(file.originalname || '').replace('.', '')
  try {
    const { url, key } = await uploadToS3({ buffer: file.buffer, contentType: file.mimetype, extension: ext })
    return res.status(201).json({ url, key })
  } catch (e) {
    return res.status(500).json({ error: 'Upload failed' })
  }
}

export async function uploadSingleLegacy(req, res) {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded. Please use field name "file"' })
    if (isS3Configured()) {
      const ext = path.extname(file.originalname || '').replace('.', '')
      const { url, key } = await uploadToS3({ buffer: file.buffer, contentType: file.mimetype, extension: ext })
      return res.json({ message: 'File uploaded successfully to S3', url, key })
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    return res.json({ message: 'File uploaded successfully to local storage', url: fileUrl, filename: file.filename })
  } catch (e) {
    console.error('Error uploading file:', e)
    return res.status(500).json({ error: 'Failed to upload file' })
  }
}

export async function uploadMultipleLegacy(req, res) {
  try {
    const files = req.files || []
    if (!files.length) return res.status(400).json({ error: 'No files uploaded. Please use field name "files"' })
    if (isS3Configured()) {
      const uploaded = []
      for (const f of files) {
        const ext = path.extname(f.originalname || '').replace('.', '')
        const { url, key } = await uploadToS3({ buffer: f.buffer, contentType: f.mimetype, extension: ext })
        uploaded.push({ url, key, originalName: f.originalname })
      }
      return res.json({ message: `${uploaded.length} files uploaded successfully to S3`, files: uploaded })
    }
    const uploaded = files.map((f) => ({
      url: `${req.protocol}://${req.get('host')}/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
    }))
    return res.json({ message: `${uploaded.length} files uploaded successfully to local storage`, files: uploaded })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to upload files' })
  }
}