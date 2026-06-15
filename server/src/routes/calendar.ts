import { Router, type Request } from 'express'
import { eventRowToJson } from '../domain/eventRow'
import { taskRowToJson } from '../domain/taskRow'
import { prisma } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get(
  '/range',
  asyncHandler(async (req, res) => {
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

    const includeCompleted = req.query.includeCompleted === 'true' || req.query.includeCompleted === '1'

    const [tasks, events] = await Promise.all([
      prisma.task.findMany({
        where: {
          user_id: userId,
          due_at: {
            not: null,
            gte: rangeStart,
            lt: rangeEnd,
          },
          ...(includeCompleted ? {} : { status: 'open' }),
        },
        orderBy: { due_at: 'asc' },
      }),
      prisma.event.findMany({
        where: {
          user_id: userId,
          starts_at: { lt: rangeEnd },
          ends_at: { gt: rangeStart },
        },
        orderBy: { starts_at: 'asc' },
      }),
    ])

    res.json({
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
      tasks: tasks.map(taskRowToJson as any),
      events: events.map(eventRowToJson as any),
    })
  })
)

export default router