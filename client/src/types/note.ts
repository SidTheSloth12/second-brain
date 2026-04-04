export type NoteListItem = {
  id: string
  title: string
  slug: string
  updatedAt: string
}

export type NoteDetail = NoteListItem & {
  content: string
  createdAt: string
}
