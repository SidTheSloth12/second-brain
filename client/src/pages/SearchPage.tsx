import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { searchSecondBrain } from '../lib/searchApi'

export function SearchPage() {
  const [q, setQ] = useState('')
  const deferredQ = useDeferredValue(q.trim())

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', deferredQ],
    queryFn: () => searchSecondBrain(deferredQ),
    enabled: deferredQ.length >= 2,
    staleTime: 20_000,
  })

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Search</h1>
          <p className="mt-1 text-sm text-slate-500">
            Full-text search across your notes and journal entries (English stemming).
          </p>
        </div>
        <div>
          <label htmlFor="search-q" className="sr-only">
            Search query
          </label>
          <input
            id="search-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try: project ideas or &quot;exact phrase&quot;"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          {q.trim().length > 0 && q.trim().length < 2 && (
            <p className="mt-2 text-xs text-slate-500">Type at least 2 characters.</p>
          )}
        </div>

        {deferredQ.length >= 2 && (
          <div className="space-y-3">
            {isFetching && <p className="text-sm text-slate-500">Searching…</p>}
            {!isFetching && results.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">No results.</p>
            )}
            <ul className="space-y-3">
              {results.map((r) => (
                <li
                  key={`${r.type}-${r.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.type === 'note'
                          ? 'bg-violet-100 text-violet-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {r.type === 'note' ? 'Note' : 'Journal'}
                    </span>
                    <Link
                      to={r.type === 'note' ? `/notes/${r.id}` : `/journal/${r.entryDate}`}
                      className="font-medium text-violet-700 hover:text-violet-900 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </div>
                  <div
                    className="mt-2 text-sm leading-relaxed text-slate-600 [&_b]:font-semibold [&_b]:text-slate-800"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  )
}
