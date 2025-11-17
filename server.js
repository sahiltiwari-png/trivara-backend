import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { connectMongo, uploadDir } from './src/db.js'
import { propertiesRoutes } from './src/routes/propertiesRoutes.js'
import { queriesRoutes } from './src/routes/queriesRoutes.js'
import { authRoutes } from './src/routes/authRoutes.js'
import { uploadRoutes } from './src/routes/uploadRoutes.js'
import { legacyUploadRoutes } from './src/routes/legacyUploadRoutes.js'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000'

await connectMongo()

const allowAllCors = !ORIGIN || ORIGIN === '*' || process.env.CORS_ALLOW_ALL === 'true'
if (allowAllCors) {
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  app.options('*', cors())
} else {
  const origins = ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  app.use(cors({ origin: origins }))
}
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(uploadDir))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const swaggerDoc = YAML.load(path.join(__dirname, 'src', 'swagger.yaml'))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))

app.use('/api/auth', authRoutes())
app.use('/api/uploads', uploadRoutes())
app.use('/api', legacyUploadRoutes())
app.use('/api/properties', propertiesRoutes())
app.use('/api/queries', queriesRoutes())

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})