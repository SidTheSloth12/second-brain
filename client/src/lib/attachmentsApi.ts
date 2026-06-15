import { api } from './api'

export type Attachment = {
  id: string
  filename: string
  filepath: string
  mime_type: string
  size: number
  note_id: string | null
  task_id: string | null
  created_at: string
}

export async function fetchAttachments(): Promise<Attachment[]> {
  const { data } = await api.get<{ attachments: Attachment[] }>('/api/attachments')
  return data.attachments
}

export async function uploadAttachment(file: File, noteId?: string, taskId?: string): Promise<Attachment> {
  const formData = new FormData()
  formData.append('file', file)
  if (noteId) formData.append('noteId', noteId)
  if (taskId) formData.append('taskId', taskId)

  const { data } = await api.post<{ attachment: Attachment }>('/api/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.attachment
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.delete(`/api/attachments/${id}`)
}
