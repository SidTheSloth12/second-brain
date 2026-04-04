import { Router, type Request } from 'express'
import { eventRowToJson, type EventRow } from '../domain/eventRow'
import { taskRowToJson, type TaskRow } from '../domain/taskRow'
import { pool } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get('/range', async (req, res) => {
  const userId = userIdFrom(req)
  const startQ = req.query.start
  const endQ = req.query.end

  if (typeof startQ !== 'string' || typeof endQ !== 'string') {
    res.status(400).json({ error: 'start and end (ISO datetimes) are required' })
    return
  }

  const rangeStart = new Date(startQ)
  const rangeEnd = new Date(endQ)
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    res.status(400).json({ error: 'Invalid start or end' })
    return
  }
  if (rangeStart >= rangeEnd) {
    res.status(400).json({ error: 'end must be after start' })
    return
  }

  const includeCompleted =
    req.query.includeCompleted === 'true' || req.query.includeCompleted === '1'

  try {
    const [tasksResult, eventsResult] = await Promise.all([
      pool.query<TaskRow>(
        `SELECT * FROM tasks
         WHERE user_id = $1
           AND due_at IS NOT NULL
           AND due_at >= $2
           AND due_at < $3
           AND ($4::boolean OR status = 'open')
         ORDER BY due_at ASC`,
        [userId, rangeStart, rangeEnd, includeCompleted]
      ),
      pool.query<EventRow>(
        `SELECT * FROM events
         WHERE user_id = $1
           AND starts_at < $3
           AND ends_at > $2
         ORDER BY starts_at ASC`,
        [userId, rangeStart, rangeEnd]
      ),
    ])

    res.json({
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
      tasks: tasksResult.rows.map(taskRowToJson),
      events: eventsResult.rows.map(eventRowToJson),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load calendar' })
  }
})

export default router
