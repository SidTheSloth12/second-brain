import type { Task } from './task'

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  allDay: boolean
  createdAt: string
  updatedAt: string
}

export type CalendarRangeResponse = {
  start: string
  end: string
  tasks: Task[]
  events: CalendarEvent[]
}

export type CalendarViewMode = 'day' | 'week' | 'month'
