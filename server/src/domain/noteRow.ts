export interface NoteRow {
  id: string
  user_id: string
  title: string
  slug: string
  content: string
  folder_id: string | null
  created_at: Date
  updated_at: Date
}

export interface NoteSummaryRow {
  id: string
  user_id: string
  title: string
  slug: string
  folder_id: string | null
  created_at: Date
  updated_at: Date
}

export function noteRowToListItem(row: NoteSummaryRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    folderId: row.folder_id,
    updatedAt: row.updated_at.toISOString(),
  }
}

export function noteRowToDetail(row: NoteRow & { tags?: string[] }) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    folderId: row.folder_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    tags: row.tags ?? [],
  }
}
