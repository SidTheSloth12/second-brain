export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'open' | 'completed'

export interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  due_at: Date | null
  priority: string
  status: string
  completed_at: Date | null
  sort_order: number
  created_at: Date
  updated_at: Date
}

export function taskRowToJson(row: TaskRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at ? row.due_at.toISOString() : null,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
