import { api } from './api'
import type { JournalDetail, JournalListEntry } from '../types/journal'

export async function fetchJournalMonth(month: string): Promise<{ month: string; entries: JournalListEntry[] }> {
  const { data } = await api.get<{ month: string; entries: JournalListEntry[] }>(
    `/api/journal?month=${encodeURIComponent(month)}`
  )
  return data
}

export async function fetchJournalEntry(
  date: string
): Promise<{ entry: JournalDetail | null; entryDate: string }> {
  const { data } = await api.get<{ entry: JournalDetail | null; entryDate: string }>(
    `/api/journal/${encodeURIComponent(date)}`
  )
  return data
}

export async function saveJournalEntry(
  date: string,
  body: { title: string; bodyHtml: string; bodyText: string }
): Promise<JournalDetail> {
  const { data } = await api.patch<{ entry: JournalDetail }>(`/api/journal/${encodeURIComponent(date)}`, body)
  return data.entry
}

export async function deleteJournalEntry(date: string): Promise<void> {
  await api.delete(`/api/journal/${encodeURIComponent(date)}`)
}
