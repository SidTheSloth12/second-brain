import { api } from './api'
import type { SearchResultItem } from '../types/search'

export async function searchSecondBrain(q: string, limit = 25): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ q, limit: String(limit) })
  const { data } = await api.get<{ results: SearchResultItem[] }>(`/api/search?${params}`)
  return data.results
}
