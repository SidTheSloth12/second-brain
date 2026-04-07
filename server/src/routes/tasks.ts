import { Router, type Request } from 'express'
import { taskRowToJson, type TaskRow } from '../domain/taskRow'
import { pool } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

type Priority = 'low' | 'medium' | 'high'

function parsePriority(v: unknown): Priority | null {
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return null
}

function parseDueAt(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function parseListId(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null
  return v
}

type TaskListRow = {
  id: string
  user_id: string
  name: string
  sort_order: number
}

async function ensureListBelongsToUser(userId: string, listId: string): Promise<boolean> {
  const result = await pool.query<TaskListRow>(
    `SELECT id FROM task_lists WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [listId, userId]
  )
  return (result.rowCount ?? 0) > 0
}

router.get('/', async (req, res) => {
  const userId = userIdFrom(req)
  const statusFilter = req.query.status
  const listId = parseListId(req.query.listId)

  let where = 'user_id = $1'
  const params: unknown[] = [userId]
  if (statusFilter === 'open' || statusFilter === 'completed') {
    params.push(statusFilter)
    where += ` AND status = $${params.length}`
  }
  if (listId) {
    params.push(listId)
    where += ` AND task_list_id = $${params.length}`
  }

  try {
    const result = await pool.query<TaskRow>(
      `SELECT *
       FROM tasks
       WHERE ${where}
       ORDER BY
         (status = 'completed'),
         CASE WHEN status = 'completed' THEN completed_at END DESC NULLS LAST,
         due_at ASC NULLS LAST,
         sort_order ASC,
         created_at ASC`,
      params
    )
    res.json({ tasks: result.rows.map(taskRowToJson) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load tasks' })
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

  const listId = parseListId(req.body?.listId)
  if (!listId) {
    res.status(400).json({ error: 'Task list id is required' })
    return
  }
  if (!(await ensureListBelongsToUser(userId, listId))) {
    res.status(400).json({ error: 'Invalid task list' })
    return
  }

  const priority = parsePriority(req.body?.priority) ?? 'low'
  const dueParsed = parseDueAt(req.body?.dueAt)
  if (dueParsed === undefined && req.body?.dueAt !== undefined && req.body?.dueAt !== null) {
    res.status(400).json({ error: 'Invalid dueAt; use ISO-8601 datetime or null' })
    return
  }
  const dueAt = dueParsed === undefined ? null : dueParsed

  try {
    const ord = await pool.query<{ n: string }>(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM tasks WHERE user_id = $1`,
      [userId]
    )
    const sortOrder = parseInt(ord.rows[0].n, 10) || 0

    const result = await pool.query<TaskRow>(
      `INSERT INTO tasks (user_id, task_list_id, title, description, due_at, priority, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, listId, title, description, dueAt, priority, sortOrder]
    )
    res.status(201).json({ task: taskRowToJson(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create task' })
  }
})

router.patch('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid task id' })
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
  if (req.body?.dueAt !== undefined) {
    const dueParsed = parseDueAt(req.body.dueAt)
    if (dueParsed === undefined) {
      res.status(400).json({ error: 'Invalid dueAt; use ISO-8601 datetime or null' })
      return
    }
    updates.push(`due_at = $${i++}`)
    values.push(dueParsed)
  }
  if (req.body?.priority !== undefined) {
    const p = parsePriority(req.body.priority)
    if (!p) {
      res.status(400).json({ error: 'priority must be low, medium, or high' })
      return
    }
    updates.push(`priority = $${i++}`)
    values.push(p)
  }
  if (req.body?.listId !== undefined) {
    const listId = parseListId(req.body.listId)
    if (!listId || !(await ensureListBelongsToUser(userId, listId))) {
      res.status(400).json({ error: 'Invalid task list' })
      return
    }
    updates.push(`task_list_id = $${i++}`)
    values.push(listId)
  }
  if (req.body?.status !== undefined) {
    if (req.body.status !== 'open' && req.body.status !== 'completed') {
      res.status(400).json({ error: 'status must be open or completed' })
      return
    }
    updates.push(`status = $${i++}`)
    values.push(req.body.status)
    if (req.body.status === 'completed') {
      updates.push(`completed_at = COALESCE(completed_at, NOW())`)
    } else {
      updates.push(`completed_at = NULL`)
    }
  }
  if (req.body?.sortOrder !== undefined) {
    if (typeof req.body.sortOrder !== 'number' || !Number.isFinite(req.body.sortOrder)) {
      res.status(400).json({ error: 'sortOrder must be a number' })
      return
    }
    updates.push(`sort_order = $${i++}`)
    values.push(Math.round(req.body.sortOrder))
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
    const result = await pool.query<TaskRow>(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE user_id = $${userParam} AND id = $${idParam}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    res.json({ task: taskRowToJson(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update task' })
  }
})

router.delete('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id

  try {
    const result = await pool.query(`DELETE FROM tasks WHERE user_id = $1 AND id = $2`, [userId, id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete task' })
  }
})

router.get('/lists', async (req, res) => {
  const userId = userIdFrom(req)
  try {
    const result = await pool.query<TaskListRow>(
      `SELECT id, user_id, name, sort_order
       FROM task_lists
       WHERE user_id = $1
       ORDER BY sort_order ASC, lower(name) ASC`,
      [userId]
    )
    res.json({ lists: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load task lists' })
  }
})

router.post('/lists', async (req, res) => {
  const userId = userIdFrom(req)
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'List name is required' })
    return
  }

  try {
    const ord = await pool.query<{ n: string }>(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM task_lists WHERE user_id = $1`,
      [userId]
    )
    const sortOrder = parseInt(ord.rows[0].n, 10) || 0
    const result = await pool.query<TaskListRow>(
      `INSERT INTO task_lists (user_id, name, sort_order)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, sort_order`,
      [userId, name, sortOrder]
    )
    res.status(201).json({ list: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create task list' })
  }
})

router.patch('/lists/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'List name is required' })
    return
  }

  try {
    const result = await pool.query<TaskListRow>(
      `UPDATE task_lists SET name = $1, updated_at = NOW()
       WHERE user_id = $2 AND id = $3
       RETURNING id, user_id, name, sort_order`,
      [name, userId, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task list not found' })
      return
    }
    res.json({ list: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update task list' })
  }
})

router.delete('/lists/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id

  try {
    const taskCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tasks WHERE user_id = $1 AND task_list_id = $2`,
      [userId, id]
    )
    if (parseInt(taskCount.rows[0].count, 10) > 0) {
      res.status(400).json({ error: 'Cannot delete a list with tasks' })
      return
    }
    const result = await pool.query(
      `DELETE FROM task_lists WHERE user_id = $1 AND id = $2`,
      [userId, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task list not found' })
      return
    }
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete task list' })
  }
})

export default router
