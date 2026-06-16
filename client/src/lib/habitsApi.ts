import { api } from'./api'
export type HabitLog={
  id:string
  habit_id:string
  date:string
  completed: boolean
}
export type Habit={
  id:string
  name:string
  frequency:string
  created_at:string
  logs: HabitLog[]
}
export async function fetchHabits(): Promise<Habit[]>{
  const { data }=await api.get<{ habits: Habit[] }>('/api/habits')
  return data.habits
}
export async function createHabit(body: { name:string; frequency?:string }): Promise<Habit>{
  const { data }=await api.post<{ habit: Habit }>('/api/habits', body)
  return data.habit
}
export async function deleteHabit(id:string): Promise<void>{
  await api.delete(`/api/habits/${id}`)
}
export async function toggleHabitLog(id:string, date:string): Promise<HabitLog>{
  const { data }=await api.post<{ log: HabitLog }>(`/api/habits/${id}/toggle`, { date })
  return data.log
}
