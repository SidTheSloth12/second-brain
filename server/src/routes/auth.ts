import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const e = email.trim().toLowerCase()
  return EMAIL_RE.test(e) ? e : null
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
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

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
      },
      select: {
        id: true,
        email: true,
        created_at: true,
      },
    })

    const token = signToken(user.id, user.email)
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at.toISOString() },
    })
  })
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password

    if (!email || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

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
  })
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, created_at: true },
    })

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
  })
)

export default router