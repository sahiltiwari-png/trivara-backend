import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()



const region = process.env.AWS_REGION || 'us-east-1'
const bucket =  process.env.S3_BUCKET_NAME || ''

console.log('S3 Bucket:',  process.env.AWS_REGION, process.env.S3_BUCKET_NAME)
export const s3 = new S3Client({ region })

export async function uploadToS3({ buffer, contentType, extension }) {
  if (!bucket) throw new Error('AWS_S3_BUCKET/S3_BUCKET_NAME is not set')
  const random = crypto.randomBytes(8).toString('hex')
  const key = `${Date.now()}-${random}${extension ? `.${extension}` : ''}`
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
    ACL: 'public-read',
  })
  await s3.send(cmd)
  const baseUrl = process.env.AWS_S3_BASE_URL || process.env.S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`
  const url = `${baseUrl.replace(/\/$/, '')}/${key}`
  return { key, url }
}