import type { Request, Response, NextFunction } from'express'
import { Prisma } from'@prisma/client'
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code==='P2002') {
      res.status(409).json({ error:'A resource with this unique field already exists' })
      return
    }
  }
  console.error('Unhandled Error:', err)
  res.status(500).json({ error:'An unexpected error occurred.', details: err?.message||String(err) })
}
