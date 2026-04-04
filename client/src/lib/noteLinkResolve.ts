import type { NoteListItem } from '../types/note'

/** Match server slugify for link resolution in the preview. */
export function slugifyNoteTitle(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'note'
}

/** Map normalized keys (slug, slugified title, lower title) → note id. */
export function buildNoteLinkResolver(notes: NoteListItem[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const n of notes) {
    m.set(n.slug.toLowerCase(), n.id)
    m.set(slugifyNoteTitle(n.title), n.id)
    m.set(n.title.trim().toLowerCase(), n.id)
  }
  return m
}

export function resolveNoteLinkTarget(target: string, resolver: Map<string, string>): string | null {
  const t = target.trim()
  if (!t) return null
  return (
    resolver.get(t.toLowerCase()) ??
    resolver.get(slugifyNoteTitle(t)) ??
    resolver.get(t.trim().toLowerCase()) ??
    null
  )
}
