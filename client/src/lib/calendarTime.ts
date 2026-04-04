import type { CalendarViewMode } from '../types/calendar'
import type { CalendarEvent } from '../types/calendar'
import type { Task } from '../types/task'

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function getMonthGridDates(anchor: Date): Date[] {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startOffset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const cell = new Date(gridStart)
    cell.setDate(gridStart.getDate() + i)
    days.push(cell)
  }
  return days
}

export function getViewRange(view: CalendarViewMode, anchor: Date): { start: Date; end: Date } {
  const a = new Date(anchor)
  if (view === 'day') {
    const start = startOfDay(a)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end }
  }
  if (view === 'week') {
    const start = startOfWeekMonday(a)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }
  const start = new Date(a.getFullYear(), a.getMonth(), 1)
  const end = new Date(a.getFullYear(), a.getMonth() + 1, 1)
  return { start, end }
}

/** Range to load from the API (month grid includes leading/trailing days). */
export function getFetchRange(view: CalendarViewMode, anchor: Date): { start: Date; end: Date } {
  if (view === 'month') {
    const grid = getMonthGridDates(anchor)
    const start = startOfDay(grid[0])
    const end = new Date(startOfDay(grid[grid.length - 1]))
    end.setDate(end.getDate() + 1)
    return { start, end }
  }
  return getViewRange(view, anchor)
}

export function eventOverlapsDay(startsAt: string, endsAt: string, day: Date): boolean {
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  const ds = startOfDay(day)
  const de = endOfDay(day)
  return s.getTime() <= de.getTime() && e.getTime() >= ds.getTime()
}

export type CalendarListItem =
  | { kind: 'task'; task: Task; sortKey: number }
  | { kind: 'event'; event: CalendarEvent; sortKey: number }

export function itemsForDay(day: Date, tasks: Task[], events: CalendarEvent[]): CalendarListItem[] {
  const items: CalendarListItem[] = []
  for (const task of tasks) {
    if (!task.dueAt) continue
    if (!isSameDay(new Date(task.dueAt), day)) continue
    items.push({ kind: 'task', task, sortKey: new Date(task.dueAt).getTime() })
  }
  for (const event of events) {
    if (!eventOverlapsDay(event.startsAt, event.endsAt, day)) continue
    items.push({ kind: 'event', event, sortKey: new Date(event.startsAt).getTime() })
  }
  items.sort((a, b) => a.sortKey - b.sortKey)
  return items
}

export function formatMonthTitle(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeekMonday(anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return startOfDay(d)
  })
}

export function formatWeekTitle(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`
}
