import { Router, type Request } from 'express'
import { journalRowToDetail, journalRowToSummary } from '../domain/journalRow'
import { prisma } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
router.use(requireAuth)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

function parseMonthParam(v: unknown): string {
  if (typeof v === 'string' && MONTH_RE.test(v)) return v
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthRangeStrings(ym: string): { start: Date; endExclusive: Date } {
  const [y, m] = ym.split('-').map(Number)
  const start = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`)
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  const endExclusive = new Date(`${ny}-${String(nm).padStart(2, '0')}-01T00:00:00.000Z`)
  return { start, endExclusive }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const month = parseMonthParam(req.query.month)
    const { start, endExclusive } = monthRangeStrings(month)

    const entries = await prisma.journalEntry.findMany({
      where: {
        user_id: userId,
        entry_date: {
          gte: start,
          lt: endExclusive,
        },
      },
      orderBy: { entry_date: 'desc' },
    })

    res.json({ month, entries: entries.map(journalRowToSummary as any) })
  })
)

router.get(
  '/:date',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const date = req.params.date as string
    if (!DATE_RE.test(date)) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' })
      return
    }

    const entryDate = new Date(`${date}T00:00:00.000Z`)

    const entry = await prisma.journalEntry.findUnique({
      where: {
        user_id_entry_date: {
          user_id: userId,
          entry_date: entryDate,
        },
      },
    })

    if (!entry) {
      res.json({
        entry: null,
        entryDate: date,
      })
      return
    }

    res.json({ entry: journalRowToDetail(entry as any), entryDate: date })
  })
)

router.patch(
  '/:date',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const date = req.params.date as string
    if (!DATE_RE.test(date)) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' })
      return
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
    if (typeof req.body?.bodyHtml !== 'string' || typeof req.body?.bodyText !== 'string') {
      res.status(400).json({ error: 'bodyHtml and bodyText are required strings' })
      return
    }

    const bodyHtml = req.body.bodyHtml
    const bodyText = req.body.bodyText
    if (bodyHtml.length > 2_000_000 || bodyText.length > 2_000_000) {
      res.status(400).json({ error: 'Body too large' })
      return
    }

    const entryDate = new Date(`${date}T00:00:00.000Z`)

    const entry = await prisma.journalEntry.upsert({
      where: {
        user_id_entry_date: {
          user_id: userId,
          entry_date: entryDate,
        },
      },
      update: {
        title,
        body_html: bodyHtml,
        body_text: bodyText,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        entry_date: entryDate,
        title,
        body_html: bodyHtml,
        body_text: bodyText,
      },
    })

    res.json({ entry: journalRowToDetail(entry as any) })
  })
)

router.delete(
  '/:date',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const date = req.params.date as string
    if (!DATE_RE.test(date)) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' })
      return
    }

    const entryDate = new Date(`${date}T00:00:00.000Z`)

    const deleted = await prisma.journalEntry.deleteMany({
      where: {
        user_id: userId,
        entry_date: entryDate,
      },
    })

    if (deleted.count === 0) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    res.status(204).send()
  })
)

export default router