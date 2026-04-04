import { Router, type Request } from 'express'
import { eventRowToJson, type EventRow } from '../domain/eventRow'
import { pool } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

function parseIso(name: string, v: unknown): Date | undefined {
  if (typeof v !== 'string') return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}

router.get('/', async (req, res) => {
  const userId = userIdFrom(req)
  const fromQ = req.query.from
  const toQ = req.query.to

  try {
    if (fromQ !== undefined || toQ !== undefined) {
      if (typeof fromQ !== 'string' || typeof toQ !== 'string') {
        res.status(400).json({ error: 'from and to (ISO datetimes) are required together' })
        return
      }
      const from = new Date(fromQ)
      const to = new Date(toQ)
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
        res.status(400).json({ error: 'Invalid from/to range' })
        return
      }
      const result = await pool.query<EventRow>(
        `SELECT * FROM events
         WHERE user_id = $1 AND starts_at < $3 AND ends_at > $2
         ORDER BY starts_at ASC`,
        [userId, from, to]
      )
      res.json({ events: result.rows.map(eventRowToJson) })
      return
    }

    const result = await pool.query<EventRow>(
      `SELECT * FROM events
       WHERE user_id = $1
       ORDER BY starts_at DESC
       LIMIT 300`,
      [userId]
    )
    res.json({ events: result.rows.map(eventRowToJson) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load events' })
  }
})

router.get('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  try {
    const result = await pool.query<EventRow>(
      `SELECT * FROM events WHERE user_id = $1 AND id = $2`,
      [userId, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.json({ event: eventRowToJson(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load event' })
  }
})

router.post('/', async (req, res) => {
  const userId = userIdFrom(req)
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() || null : null

  const startsAt = parseIso('startsAt', req.body?.startsAt)
  const endsAt = parseIso('endsAt', req.body?.endsAt)
  if (!startsAt || !endsAt) {
    res.status(400).json({ error: 'startsAt and endsAt must be valid ISO-8601 datetimes' })
    return
  }
  if (endsAt < startsAt) {
    res.status(400).json({ error: 'endsAt must be after startsAt' })
    return
  }

  const allDay = Boolean(req.body?.allDay)

  try {
    const result = await pool.query<EventRow>(
      `INSERT INTO events (user_id, title, description, starts_at, ends_at, all_day)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, description, startsAt, endsAt, allDay]
    )
    res.status(201).json({ event: eventRowToJson(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create event' })
  }
})

router.patch('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  if (!id) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  const updates: string[] = []
  const values: unknown[] = []
  let i = 1

  if (req.body?.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      res.status(400).json({ error: 'Title cannot be empty' })
      return
    }
    updates.push(`title = $${i++}`)
    values.push(req.body.title.trim())
  }
  if (req.body?.description !== undefined) {
    updates.push(`description = $${i++}`)
    values.push(
      typeof req.body.description === 'string' ? req.body.description.trim() || null : null
    )
  }
  if (req.body?.startsAt !== undefined) {
    const d = parseIso('startsAt', req.body.startsAt)
    if (!d) {
      res.status(400).json({ error: 'Invalid startsAt' })
      return
    }
    updates.push(`starts_at = $${i++}`)
    values.push(d)
  }
  if (req.body?.endsAt !== undefined) {
    const d = parseIso('endsAt', req.body.endsAt)
    if (!d) {
      res.status(400).json({ error: 'Invalid endsAt' })
      return
    }
    updates.push(`ends_at = $${i++}`)
    values.push(d)
  }
  if (req.body?.allDay !== undefined) {
    updates.push(`all_day = $${i++}`)
    values.push(Boolean(req.body.allDay))
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' })
    return
  }

  updates.push(`updated_at = NOW()`)
  const userParam = i
  const idParam = i + 1
  values.push(userId, id)

  try {
    const result = await pool.query<EventRow>(
      `UPDATE events SET ${updates.join(', ')}
       WHERE user_id = $${userParam} AND id = $${idParam}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    const row = result.rows[0]
    if (row.ends_at < row.starts_at) {
      res.status(400).json({ error: 'endsAt must be after startsAt' })
      return
    }
    res.json({ event: eventRowToJson(row) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update event' })
  }
})

router.delete('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  try {
    const result = await pool.query(`DELETE FROM events WHERE user_id = $1 AND id = $2`, [userId, id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete event' })
  }
})

export default router
