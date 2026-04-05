import { Router, type Request } from 'express'
import { pool } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get('/', async (req, res) => {
  const userId = userIdFrom(req)
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 240) : ''
  const limitRaw = Number(req.query.limit)
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 25

  if (!q) {
    res.json({ results: [] })
    return
  }

  try {
    const sql = `
      WITH q AS (SELECT websearch_to_tsquery('english', $2::text) AS tsq),
      hits AS (
        SELECT
          'note'::text AS type,
          n.id::text AS result_id,
          n.title AS title,
          NULL::date AS entry_date,
          ts_headline(
            'english',
            coalesce(n.content, ''),
            (SELECT tsq FROM q),
            'MaxWords=40, MinWords=12, ShortWord=2'
          ) AS snippet,
          ts_rank(
            to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.content, '')),
            (SELECT tsq FROM q)
          ) AS rank
        FROM notes n
        WHERE n.user_id = $1::uuid
          AND (coalesce(n.title, '') ILIKE '%' || $2::text || '%' OR coalesce(n.content, '') ILIKE '%' || $2::text || '%')
        UNION ALL
        SELECT
          'journal'::text,
          j.id::text,
          coalesce(nullif(j.title, ''), to_char(j.entry_date, 'YYYY-MM-DD')),
          j.entry_date,
          ts_headline(
            'english',
            coalesce(j.body_text, ''),
            (SELECT tsq FROM q),
            'MaxWords=40, MinWords=12, ShortWord=2'
          ),
          ts_rank(
            to_tsvector('english', coalesce(j.title, '') || ' ' || coalesce(j.body_text, '')),
            (SELECT tsq FROM q)
          )
        FROM journal_entries j
        WHERE j.user_id = $1::uuid
          AND (coalesce(j.title, '') ILIKE '%' || $2::text || '%' OR coalesce(j.body_text, '') ILIKE '%' || $2::text || '%')
      )
      SELECT type, result_id, title, entry_date, snippet, rank
      FROM hits
      ORDER BY rank DESC NULLS LAST, title ASC
      LIMIT $3::int
    `

    const result = await pool.query<{
      type: string
      result_id: string
      title: string
      entry_date: Date | null
      snippet: string
      rank: number
    }>(sql, [userId, q, limit])

    res.json({
      results: result.rows.map((row) => ({
        type: row.type as 'note' | 'journal',
        id: row.result_id,
        title: row.title,
        snippet: row.snippet,
        rank: row.rank,
        entryDate:
          row.type === 'journal' && row.entry_date
            ? new Date(row.entry_date).toISOString().slice(0, 10)
            : null,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'Invalid search query' })
  }
})

export default router
