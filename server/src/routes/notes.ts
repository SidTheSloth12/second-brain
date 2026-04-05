import { Router, type Request } from 'express'
import type { PoolClient } from 'pg'
import {
  noteRowToDetail,
  noteRowToListItem,
  type NoteRow,
  type NoteSummaryRow,
} from '../domain/noteRow'
import { pool } from '../db'
import { slugify } from '../lib/slug'
import { extractWikiTargets } from '../lib/wikiLinks'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

async function nextUniqueSlug(
  client: PoolClient,
  userId: string,
  base: string,
  excludeId: string | null
): Promise<string> {
  let slug = slugify(base)
  let i = 0
  for (;;) {
    const q = await client.query<{ id: string }>(
      `SELECT id FROM notes WHERE user_id = $1 AND slug = $2 AND ($3::uuid IS NULL OR id <> $3)`,
      [userId, slug, excludeId]
    )
    if (q.rowCount === 0) return slug
    i += 1
    slug = `${slugify(base)}-${i}`
  }
}

async function resolveTargetToId(
  client: PoolClient,
  userId: string,
  target: string
): Promise<string | null> {
  const t = target.trim()
  if (!t) return null
  const asSlug = slugify(t)
  const r = await client.query<{ id: string }>(
    `SELECT id FROM notes
     WHERE user_id = $1
       AND (slug = $2 OR lower(trim(title)) = lower(trim($3)))
     LIMIT 1`,
    [userId, asSlug, t]
  )
  return r.rows[0]?.id ?? null
}

async function syncNoteLinks(client: PoolClient, userId: string, fromNoteId: string, content: string) {
  await client.query(`DELETE FROM note_links WHERE from_note_id = $1`, [fromNoteId])
  const targets = extractWikiTargets(content)
  for (const target of targets) {
    const toId = await resolveTargetToId(client, userId, target)
    if (!toId || toId === fromNoteId) continue
    await client.query(
      `INSERT INTO note_links (from_note_id, to_note_id, user_id) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [fromNoteId, toId, userId]
    )
  }
}

router.get('/', async (req, res) => {
  const userId = userIdFrom(req)
  try {
    const result = await pool.query<NoteSummaryRow>(
      `SELECT id, user_id, title, slug, folder_id, created_at, updated_at
       FROM notes WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    )
    res.json({ notes: result.rows.map(noteRowToListItem) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load notes' })
  }
})

router.get('/graph', async (req, res) => {
  const userId = userIdFrom(req)
  try {
    const notesResult = await pool.query(`SELECT id, title FROM notes WHERE user_id = $1`, [userId])
    const linksResult = await pool.query(
      `SELECT from_note_id as source, to_note_id as target FROM note_links WHERE user_id = $1`,
      [userId]
    )
    res.json({
      nodes: notesResult.rows,
      links: linksResult.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load graph data' })
  }
})

router.get('/:id/backlinks', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  try {
    const result = await pool.query<NoteSummaryRow>(
      `SELECT n.id, n.user_id, n.title, n.slug, n.folder_id, n.created_at, n.updated_at
       FROM notes n
       INNER JOIN note_links l ON l.from_note_id = n.id
       WHERE l.to_note_id = $1 AND n.user_id = $2
       ORDER BY n.title ASC`,
      [id, userId]
    )
    res.json({ notes: result.rows.map(noteRowToListItem) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load backlinks' })
  }
})

router.get('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  try {
    const result = await pool.query<NoteRow>(
      `SELECT id, user_id, title, slug, content, folder_id, created_at, updated_at
       FROM notes WHERE user_id = $1 AND id = $2`,
      [userId, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.json({ note: noteRowToDetail(result.rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load note' })
  }
})

router.post('/', async (req, res) => {
  const userId = userIdFrom(req)
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title) {
    res.status(400).json({ error: 'Title is required' })
    return
  }
  const content = typeof req.body?.content === 'string' ? req.body.content : ''
  const folderId = typeof req.body?.folderId === 'string' ? req.body.folderId : null

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const slug = await nextUniqueSlug(client, userId, title, null)
    const ins = await client.query<NoteRow>(
      `INSERT INTO notes (user_id, title, slug, content, folder_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, slug, content, folder_id, created_at, updated_at`,
      [userId, title, slug, content, folderId]
    )
    const row = ins.rows[0]
    await syncNoteLinks(client, userId, row.id, content)
    await client.query('COMMIT')
    res.status(201).json({ note: noteRowToDetail(row) })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Could not create note' })
  } finally {
    client.release()
  }
})

router.patch('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id

  const updates: string[] = []
  const values: unknown[] = []
  let i = 1
  let newTitle: string | undefined
  let newContent: string | undefined

  if (req.body?.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      res.status(400).json({ error: 'Title cannot be empty' })
      return
    }
    newTitle = req.body.title.trim()
    updates.push(`title = $${i++}`)
    values.push(newTitle)
  }
  if (req.body?.content !== undefined) {
    if (typeof req.body.content !== 'string') {
      res.status(400).json({ error: 'content must be a string' })
      return
    }
    newContent = req.body.content
    updates.push(`content = $${i++}`)
    values.push(newContent)
  }
  if (req.body?.folderId !== undefined) {
    const folderId = req.body.folderId === null ? null : String(req.body.folderId)
    updates.push(`folder_id = $${i++}`)
    values.push(folderId)
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cur = await client.query<NoteRow>(
      `SELECT id, user_id, title, slug, content, folder_id, created_at, updated_at
       FROM notes WHERE user_id = $1 AND id = $2 FOR UPDATE`,
      [userId, id]
    )
    if (cur.rowCount === 0) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Note not found' })
      return
    }
    const row = cur.rows[0]
    const titleVal = newTitle ?? row.title
    const contentVal = newContent ?? row.content

    if (newTitle !== undefined) {
      const newSlug = await nextUniqueSlug(client, userId, titleVal, id)
      updates.push(`slug = $${i++}`)
      values.push(newSlug)
    }

    updates.push(`updated_at = NOW()`)
    const userParam = i
    const idParam = i + 1
    values.push(userId, id)

    const result = await client.query<NoteRow>(
      `UPDATE notes SET ${updates.join(', ')}
       WHERE user_id = $${userParam} AND id = $${idParam}
       RETURNING id, user_id, title, slug, content, folder_id, created_at, updated_at`,
      values
    )

    const updated = result.rows[0]
    await syncNoteLinks(client, userId, updated.id, updated.content)
    await client.query('COMMIT')
    res.json({ note: noteRowToDetail(updated) })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Could not update note' })
  } finally {
    client.release()
  }
})

router.delete('/:id', async (req, res) => {
  const userId = userIdFrom(req)
  const id = req.params.id
  try {
    const result = await pool.query(`DELETE FROM notes WHERE user_id = $1 AND id = $2`, [userId, id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete note' })
  }
})

export default router
