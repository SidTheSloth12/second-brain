import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import calendarRoutes from './routes/calendar'
import eventRoutes from './routes/events'
import journalRoutes from './routes/journal'
import noteRoutes from './routes/notes'
import searchRoutes from './routes/search'
import taskRoutes from './routes/tasks'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set in .env and be at least 32 characters (e.g. openssl rand -base64 32).')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 5000

const frontendOrigins =
  process.env.FRONTEND_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? ['http://localhost:5173']

app.use(
  cors({
    origin: frontendOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/journal', journalRoutes)
app.use('/api/search', searchRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
