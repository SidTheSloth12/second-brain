import { api } from './api'
import type { CalendarRangeResponse } from '../types/calendar'

export async function fetchCalendarRange(
  start: Date,
  end: Date,
  includeCompleted = false
): Promise<CalendarRangeResponse> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  })
  if (includeCompleted) params.set('includeCompleted', 'true')
  const { data } = await api.get<CalendarRangeResponse>(`/api/calendar/range?${params}`)
  return data
}
