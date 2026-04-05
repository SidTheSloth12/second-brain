import { Router, type Request } from 'express'
import { pool } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { folderRowToClient, type FolderRow } from '../domain/folderRow'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get('/', async (req, res) => {
  const userId = userIdFrom(req)
  try {
    const result = await pool.query<FolderRow>(
      `SELECT id, user_id, parent_id, name, created_at, updated_at
       FROM folders WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    )
    res.json({ folders: result.rows.map(folderRowToClient) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load folders' })
  }
})

router.post('/', async (req, res) => {
  const userId = userIdFrom(req)
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const parentId = typeof req.body?.parentId === 'string' ? req.body.parentId : null

  if (!name) {
    res.status(400).json({ error: 'Folder name is required' })
    return
  }

  try {
    // Optionally verify parentId belongs to user
    if (parentId) {
      const parentCheck = await pool.query(`SELECT id FROM folders WHERE id = $1 AND user_id = $2`, [parentId, userId])
      if (parentCheck.rowCount === 0) {
        res.status(400).json({ error: 'Invalid parent folder' })
        return
      }
    }

    const ins = await pool.query<FolderRow>(
      `INSERT INTO folders (user_id, parent_id, name)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, parent_id, name, created_at, updated_at`,
      [userId, parentId, name]
    )
    res.status(201).json({ folder: folderRowToClient(ins.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create folder' })
  }
})

router.patch('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id

  const updates: string[] = []
  const values: any[] = []
  let i = 1

  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim()
    if (!name) {
      res.status(400).json({ error: 'Folder name cannot be empty' })
      return
    }
    updates.push(`name = $${i++}`)
    values.push(name)
  }

  if (req.body?.parentId !== undefined) {
    const parentId = req.body.parentId === null ? null : String(req.body.parentId)
    updates.push(`parent_id = $${i++}`)
    values.push(parentId)
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
    const result = await pool.query<FolderRow>(
      `UPDATE folders SET ${updates.join(', ')}
       WHERE user_id = $${userParam} AND id = $${idParam}
       RETURNING id, user_id, parent_id, name, created_at, updated_at`,
      values
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Folder not found' })
      return
    }
    res.json({ folder: folderRowToClient(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update folder' })
  }
})

router.delete('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  try {
    const result = await pool.query(`DELETE FROM folders WHERE user_id = $1 AND id = $2`, [userId, id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Folder not found' })
      return
    }
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete folder' })
  }
})

export default router
