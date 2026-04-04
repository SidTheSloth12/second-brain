import { Router, type Request } from 'express'
import { journalRowToDetail, journalRowToSummary, type JournalRow } from '../domain/journalRow'
import { pool } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

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

function monthRangeStrings(ym: string): { start: string; endExclusive: string } {
  const [y, m] = ym.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  const endExclusive = `${ny}-${String(nm).padStart(2, '0')}-01`
  return { start, endExclusive }
}

router.get('/', async (req, res) => {
  const userId = userIdFrom(req)
  const month = parseMonthParam(req.query.month)
  const { start, endExclusive } = monthRangeStrings(month)

  try {
    const result = await pool.query<JournalRow>(
      `SELECT id, user_id, entry_date, title, body_html, body_text, created_at, updated_at
       FROM journal_entries
       WHERE user_id = $1 AND entry_date >= $2::date AND entry_date < $3::date
       ORDER BY entry_date DESC`,
      [userId, start, endExclusive]
    )
    res.json({ month, entries: result.rows.map(journalRowToSummary) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load journal' })
  }
})

router.get('/:date', async (req, res) => {
  const userId = userIdFrom(req)
  const date = req.params.date
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'date must be YYYY-MM-DD' })
    return
  }

  try {
    const result = await pool.query<JournalRow>(
      `SELECT id, user_id, entry_date, title, body_html, body_text, created_at, updated_at
       FROM journal_entries
       WHERE user_id = $1 AND entry_date = $2::date`,
      [userId, date]
    )
    if (result.rowCount === 0) {
      res.json({
        entry: null,
        entryDate: date,
      })
      return
    }
    res.json({ entry: journalRowToDetail(result.rows[0]), entryDate: date })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load entry' })
  }
})

router.patch('/:date', async (req, res) => {
  const userId = userIdFrom(req)
  const date = req.params.date
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

  try {
    const result = await pool.query<JournalRow>(
      `INSERT INTO journal_entries (user_id, entry_date, title, body_html, body_text)
       VALUES ($1, $2::date, $3, $4, $5)
       ON CONFLICT (user_id, entry_date) DO UPDATE SET
         title = EXCLUDED.title,
         body_html = EXCLUDED.body_html,
         body_text = EXCLUDED.body_text,
         updated_at = NOW()
       RETURNING id, user_id, entry_date, title, body_html, body_text, created_at, updated_at`,
      [userId, date, title, bodyHtml, bodyText]
    )
    res.json({ entry: journalRowToDetail(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not save journal entry' })
  }
})

router.delete('/:date', async (req, res) => {
  const userId = userIdFrom(req)
  const date = req.params.date
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'date must be YYYY-MM-DD' })
    return
  }

  try {
    const result = await pool.query(
      `DELETE FROM journal_entries WHERE user_id = $1 AND entry_date = $2::date`,
      [userId, date]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete entry' })
  }
})

export default router
