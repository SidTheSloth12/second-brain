import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  email: string
}

export interface AuthedRequest extends Request {
  userId: string
  userEmail: string
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters')
  }
  return secret
}

export function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, getSecret(), { expiresIn: '7d' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization' })
    return
  }

  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload
    if (!decoded.sub || !decoded.email) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    ;(req as AuthedRequest).userId = decoded.sub
    ;(req as AuthedRequest).userEmail = decoded.email
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
