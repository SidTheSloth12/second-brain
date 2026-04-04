export type SearchResultItem = {
  type: 'note' | 'journal'
  id: string
  title: string
  snippet: string
  rank: number
  entryDate: string | null
}
