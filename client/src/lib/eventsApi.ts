import { api } from './api'
import type { CalendarEvent } from '../types/calendar'

export async function createEvent(body: {
  title: string
  description?: string | null
  startsAt: string
  endsAt: string
  allDay?: boolean
}): Promise<CalendarEvent> {
  const { data } = await api.post<{ event: CalendarEvent }>('/api/events', body)
  return data.event
}

export async function updateEvent(
  id: string,
  body: Partial<{
    title: string
    description: string | null
    startsAt: string
    endsAt: string
    allDay: boolean
  }>
): Promise<CalendarEvent> {
  const { data } = await api.patch<{ event: CalendarEvent }>(`/api/events/${id}`, body)
  return data.event
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/api/events/${id}`)
}
