import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const e = email.trim().toLowerCase()
  return EMAIL_RE.test(e) ? e : null
}

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (!email) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const result = await pool.query<{ id: string; email: string; created_at: Date }>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, passwordHash]
    )
    const user = result.rows[0]
    const token = signToken(user.id, user.email)
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at.toISOString() },
    })
  } catch (err: unknown) {
    const code = typeof err === 'object' && err && 'code' in err ? (err as { code: string }).code : ''
    if (code === '23505') {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Could not create account' })
  }
})

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (!email || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  try {
    const result = await pool.query<{ id: string; email: string; password_hash: string; created_at: Date }>(
      `SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = $1`,
      [email]
    )
    const user = result.rows[0]
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = signToken(user.id, user.email)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at.toISOString(),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not sign in' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest

  try {
    const result = await pool.query<{ id: string; email: string; created_at: Date }>(
      `SELECT id, email, created_at FROM users WHERE id = $1`,
      [userId]
    )
    const user = result.rows[0]
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at.toISOString(),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load profile' })
  }
})

export default router
