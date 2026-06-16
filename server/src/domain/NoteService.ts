import { prisma } from '../db'
import { slugify } from '../lib/slug'
import { extractWikiTargets } from '../lib/wikiLinks'

function normalizeTagName(name: string) {
  return name.trim()
}

export class NoteService {
  static async nextUniqueSlug(userId: string, base: string, excludeId: string | null): Promise<string> {
    let slug = slugify(base)
    let i = 0
    for (;;) {
      const note = await prisma.note.findFirst({
        where: {
          user_id: userId,
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      })
      if (!note) return slug
      i += 1
      slug = `${slugify(base)}-${i}`
    }
  }

  static async syncNoteLinks(userId: string, fromNoteId: string, content: string) {
    await prisma.noteLink.deleteMany({ where: { from_note_id: fromNoteId } })
    const targets = extractWikiTargets(content).map((t) => t.trim()).filter(Boolean)
    if (targets.length === 0) return
    const slugs = targets.map(slugify)
    const rawNames = targets.map((t) => t.toLowerCase())
    const r: any[] = await prisma.$queryRaw`
      SELECT id FROM notes
      WHERE user_id = ${userId}::uuid
      AND (slug = ANY(${slugs}::text[]) OR lower(trim(title)) = ANY(${rawNames}::text[]))
    `
    const toIds = Array.from(new Set(r.map((row) => row.id))).filter((id) => id !== fromNoteId)
    if (toIds.length === 0) return
    await prisma.noteLink.createMany({
      data: toIds.map((to_note_id) => ({
        from_note_id: fromNoteId,
        to_note_id,
        user_id: userId,
      })),
      skipDuplicates: true,
    })
  }

  static async syncNoteTags(userId: string, noteId: string, tags: readonly string[]) {
    const cleaned = tags.map(normalizeTagName).filter((tag) => tag.length > 0)
    const uniqueTags = Array.from(new Set(cleaned.map((tag) => tag.toLowerCase()))).map(
      (lower) => cleaned.find((tag) => tag.toLowerCase() === lower) as string
    )
    await prisma.noteTag.deleteMany({ where: { note_id: noteId } })
    if (uniqueTags.length === 0) return
    for (const name of uniqueTags) {
      const normalizedName = name.toLowerCase()
      await prisma.tag.upsert({
        where: { user_id_normalized_name: { user_id: userId, normalized_name: normalizedName } },
        update: { name },
        create: { user_id: userId, name, normalized_name: normalizedName },
      })
    }
    const normalizedNames = uniqueTags.map((t) => t.toLowerCase())
    const dbTags = await prisma.tag.findMany({
      where: { user_id: userId, normalized_name: { in: normalizedNames } },
    })
    if (dbTags.length > 0) {
      await prisma.noteTag.createMany({
        data: dbTags.map((t) => ({ note_id: noteId, tag_id: t.id })),
        skipDuplicates: true,
      })
    }
  }

  static async fetchNoteDetail(userId: string, id: string) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: { note_tags: { include: { tag: true } } },
    })
    if (!note || note.user_id !== userId) return null
    return {
      ...note,
      tags: note.note_tags.map((nt) => nt.tag.name).sort(),
    }
  }
}
