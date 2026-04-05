export interface FolderRow {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  created_at: Date
  updated_at: Date
}

export function folderRowToClient(row: FolderRow) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
