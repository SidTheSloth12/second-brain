import { api } from './api'
import type { Folder } from '../types/folder'

export async function fetchFolders(): Promise<Folder[]> {
  const { data } = await api.get<{ folders: Folder[] }>('/api/folders')
  return data.folders
}

export async function createFolder(body: { name: string; parentId?: string | null }): Promise<Folder> {
  const { data } = await api.post<{ folder: Folder }>('/api/folders', body)
  return data.folder
}

export async function updateFolder(
  id: string,
  body: Partial<{ name: string; parentId: string | null }>
): Promise<Folder> {
  const { data } = await api.patch<{ folder: Folder }>(`/api/folders/${id}`, body)
  return data.folder
}

export async function deleteFolder(id: string): Promise<void> {
  await api.delete(`/api/folders/${id}`)
}
