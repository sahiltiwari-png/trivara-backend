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

await connectMongo()

/* ----------------------------------------
   CUSTOM CORS CONFIGURATION
----------------------------------------- */

const allowedOrigins = [
  "http://13.204.198.246:5173",
  "https://hrms.gounicrew.com",
  "https://trivaraa.netlify.app"
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    } else {
      return callback(new Error("Not allowed by CORS"))
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

app.options('*', cors())

/* ----------------------------------------
   EXPRESS CONFIG
----------------------------------------- */

app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(uploadDir))

/* ----------------------------------------
   HEALTH CHECK
----------------------------------------- */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

/* ----------------------------------------
   SWAGGER DOCS
----------------------------------------- */

const swaggerDoc = YAML.load(path.join(__dirname, 'src', 'swagger.yaml'))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))

/* ----------------------------------------
   ROUTES
----------------------------------------- */

app.use('/api/auth', authRoutes())
app.use('/api/uploads', uploadRoutes())
app.use('/api', legacyUploadRoutes())
app.use('/api/properties', propertiesRoutes())
app.use('/api/queries', queriesRoutes())

/* ----------------------------------------
   START SERVER
----------------------------------------- */

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
