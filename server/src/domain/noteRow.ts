export interface NoteRow {
  id: string
  user_id: string
  title: string
  slug: string
  content: string
  created_at: Date
  updated_at: Date
}

export interface NoteSummaryRow {
  id: string
  user_id: string
  title: string
  slug: string
  created_at: Date
  updated_at: Date
}

export function noteRowToListItem(row: NoteSummaryRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    updatedAt: row.updated_at.toISOString(),
  }
}

export function noteRowToDetail(row: NoteRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
