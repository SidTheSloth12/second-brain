import { Router, type Request } from 'express'
import { noteRowToDetail, noteRowToListItem } from '../domain/noteRow'
import { prisma } from '../db'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'
import { NoteService } from '../domain/NoteService'

const router = Router()
router.use(requireAuth)

function userIdFrom(req: Request): string {
  return (req as unknown as AuthedRequest).userId
}

router.get(
  '/tags',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const tags = await prisma.tag.findMany({
      where: { user_id: userId },
      select: { id: true, name: true },
      orderBy: { normalized_name: 'asc' },
    })
    res.json({ tags })
  })
)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const notes = await prisma.note.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        user_id: true,
        title: true,
        slug: true,
        folder_id: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
    })
    res.json({ notes: notes.map(noteRowToListItem as any) })
  })
)

router.get(
  '/graph',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const [nodes, links] = await Promise.all([
      prisma.note.findMany({
        where: { user_id: userId },
        select: { id: true, title: true },
        take: 1000,
        orderBy: { updated_at: 'desc' },
      }),
      prisma.noteLink.findMany({
        where: { user_id: userId },
        select: { from_note_id: true, to_note_id: true },
        take: 5000,
      }),
    ])
    res.json({
      nodes,
      links: links.map((l) => ({ source: l.from_note_id, target: l.to_note_id })),
    })
  })
)

router.get(
  '/:id/backlinks',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    const links = await prisma.noteLink.findMany({
      where: { to_note_id: id, user_id: userId },
      include: { from_note: true },
      orderBy: { from_note: { title: 'asc' } },
    })
    const notes = links.map((l) => l.from_note)
    res.json({ notes: notes.map(noteRowToListItem as any) })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    const note = await NoteService.fetchNoteDetail(userId, id)
    if (!note) {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.json({ note: noteRowToDetail(note as any) })
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
    if (!title) {
      res.status(400).json({ error: 'Title is required' })
      return
    }
    const content = typeof req.body?.content === 'string' ? req.body.content : ''
    const folderId = typeof req.body?.folderId === 'string' ? req.body.folderId : null
    const tags = Array.isArray(req.body?.tags) ? req.body.tags.map(String) : []
    const slug = await NoteService.nextUniqueSlug(userId, title, null)

    const note = await prisma.note.create({
      data: {
        user_id: userId,
        title,
        slug,
        content,
        folder_id: folderId,
      },
    })
    await NoteService.syncNoteLinks(userId, note.id, content)
    if (tags.length > 0) {
      await NoteService.syncNoteTags(userId, note.id, tags)
    }
    const detail = await NoteService.fetchNoteDetail(userId, note.id)
    res.status(201).json({ note: noteRowToDetail(detail as any) })
  })
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string
    const data: any = {}
    let newTags: string[] | undefined

    if (req.body?.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        res.status(400).json({ error: 'Title cannot be empty' })
        return
      }
      data.title = req.body.title.trim()
    }
    if (req.body?.content !== undefined) {
      if (typeof req.body.content !== 'string') {
        res.status(400).json({ error: 'content must be a string' })
        return
      }
      data.content = req.body.content
    }
    if (req.body?.folderId !== undefined) {
      data.folder_id = req.body.folderId === null ? null : String(req.body.folderId)
    }
    if (req.body?.tags !== undefined) {
      if (!Array.isArray(req.body.tags)) {
        res.status(400).json({ error: 'tags must be an array' })
        return
      }
      newTags = req.body.tags.map(String)
    }

    if (Object.keys(data).length === 0 && newTags === undefined) {
      res.status(400).json({ error: 'No valid fields to update' })
      return
    }

    const row = await prisma.note.findUnique({ where: { id } })
    if (!row || row.user_id !== userId) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    if (data.title !== undefined && data.title !== row.title) {
      data.slug = await NoteService.nextUniqueSlug(userId, data.title, id)
    }

    let updated = row
    if (Object.keys(data).length > 0) {
      data.updated_at = new Date()
      updated = await prisma.note.update({
        where: { id },
        data,
      })
    }

    await NoteService.syncNoteLinks(userId, updated.id, updated.content)
    if (newTags !== undefined) {
      await NoteService.syncNoteTags(userId, updated.id, newTags)
    }

    const detail = await NoteService.fetchNoteDetail(userId, updated.id)
    res.json({ note: noteRowToDetail(detail as any) })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = userIdFrom(req)
    const id = req.params.id as string

    const deletedNote = await prisma.note.deleteMany({
      where: { user_id: userId, id },
    })

    if (deletedNote.count === 0) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    res.status(204).send()
  })
)

export default router