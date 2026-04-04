export interface EventRow {
  id: string
  user_id: string
  title: string
  description: string | null
  starts_at: Date
  ends_at: Date
  all_day: boolean
  created_at: Date
  updated_at: Date
}

export function eventRowToJson(row: EventRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    allDay: row.all_day,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
