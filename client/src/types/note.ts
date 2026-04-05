export type NoteListItem = {
  id: string
  title: string
  slug: string
  folderId: string | null
  updatedAt: string
}

export type NoteDetail = NoteListItem & {
  content: string
  createdAt: string
}
