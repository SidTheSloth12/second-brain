import { api } from './api'
import type { NoteDetail, NoteListItem } from '../types/note'

export async function fetchNotes(): Promise<NoteListItem[]> {
  const { data } = await api.get<{ notes: NoteListItem[] }>('/api/notes')
  return data.notes
}

export async function fetchNote(id: string): Promise<NoteDetail> {
  const { data } = await api.get<{ note: NoteDetail }>(`/api/notes/${id}`)
  return data.note
}

export async function fetchGraph(): Promise<{ nodes: { id: string; title: string }[]; links: { source: string; target: string }[] }> {
  const { data } = await api.get<{ nodes: { id: string; title: string }[]; links: { source: string; target: string }[] }>('/api/notes/graph')
  return data
}

export async function fetchTags(): Promise<string[]> {
  const { data } = await api.get<{ tags: { name: string }[] }>('/api/notes/tags')
  return data.tags.map((tag) => tag.name)
}

export async function fetchNoteBacklinks(id: string): Promise<NoteListItem[]> {
  const { data } = await api.get<{ notes: NoteListItem[] }>(`/api/notes/${id}/backlinks`)
  return data.notes
}

export async function createNote(body: { title: string; content?: string; folderId?: string | null; tags?: string[] }): Promise<NoteDetail> {
  const { data } = await api.post<{ note: NoteDetail }>('/api/notes', body)
  return data.note
}

export async function updateNote(
  id: string,
  body: Partial<{ title: string; content: string; folderId: string | null; tags: string[] }>
): Promise<NoteDetail> {
  const { data } = await api.patch<{ note: NoteDetail }>(`/api/notes/${id}`, body)
  return data.note
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/api/notes/${id}`)
}
