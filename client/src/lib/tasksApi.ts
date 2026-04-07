import { api } from './api'
import type { Task, TaskFilter, TaskList } from '../types/task'

export async function fetchTasks(filter: TaskFilter, listId?: string): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filter !== 'all') params.set('status', filter)
  if (listId) params.set('listId', listId)
  const query = params.toString() ? `?${params.toString()}` : ''
  const { data } = await api.get<{ tasks: Task[] }>(`/api/tasks${query}`)
  return data.tasks
}

export async function fetchTaskLists(): Promise<TaskList[]> {
  const { data } = await api.get<{ lists: TaskList[] }>('/api/tasks/lists')
  return data.lists
}

export async function createTaskList(body: { name: string }): Promise<TaskList> {
  const { data } = await api.post<{ list: TaskList }>('/api/tasks/lists', body)
  return data.list
}

export async function updateTaskList(id: string, body: { name: string }): Promise<TaskList> {
  const { data } = await api.patch<{ list: TaskList }>(`/api/tasks/lists/${id}`, body)
  return data.list
}

export async function deleteTaskList(id: string): Promise<void> {
  await api.delete(`/api/tasks/lists/${id}`)
}

export async function createTask(body: {
  title: string
  description?: string | null
  dueAt?: string | null
  priority?: Task['priority']
  listId: string
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
    listId: string
  }>
): Promise<Task> {
  const { data } = await api.patch<{ task: Task }>(`/api/tasks/${id}`, body)
  return data.task
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}`)
}
