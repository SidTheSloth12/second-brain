import { api } from './api'
import type { Task, TaskFilter } from '../types/task'

export async function fetchTasks(filter: TaskFilter): Promise<Task[]> {
  const q = filter === 'all' ? '' : `?status=${filter}`
  const { data } = await api.get<{ tasks: Task[] }>(`/api/tasks${q}`)
  return data.tasks
}

export async function createTask(body: {
  title: string
  description?: string | null
  dueAt?: string | null
  priority?: Task['priority']
}): Promise<Task> {
  const { data } = await api.post<{ task: Task }>('/api/tasks', body)
  return data.task
}

export async function updateTask(
  id: string,
  body: Partial<{
    title: string
    description: string | null
    dueAt: string | null
    priority: Task['priority']
    status: Task['status']
    sortOrder: number
  }>
): Promise<Task> {
  const { data } = await api.patch<{ task: Task }>(`/api/tasks/${id}`, body)
  return data.task
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}`)
}
