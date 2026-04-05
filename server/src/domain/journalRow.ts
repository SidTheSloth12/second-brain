export interface JournalRow {
  id: string
  user_id: string
  entry_date: Date
  title: string
  body_html: string
  body_text: string
  created_at: Date
  updated_at: Date
}

function formatEntryDate(d: Date): string {
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const dateStr = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${dateStr}`
}

export function journalRowToSummary(row: JournalRow) {
  return {
    id: row.id,
    entryDate: formatEntryDate(row.entry_date),
    title: row.title,
    preview: row.body_text.length > 160 ? `${row.body_text.slice(0, 157)}…` : row.body_text,
    updatedAt: row.updated_at.toISOString(),
  }
}

export function journalRowToDetail(row: JournalRow) {
  return {
    id: row.id,
    entryDate: formatEntryDate(row.entry_date),
    title: row.title,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
