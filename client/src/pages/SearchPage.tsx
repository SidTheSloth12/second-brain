import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Search</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {q.trim().length > 0 && q.trim().length < 2 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Type at least 2 characters.</p>
          )}
        </div>

        {deferredQ.length >= 2 && (
          <div className="space-y-3">
            {isFetching && <p className="text-sm text-slate-500 dark:text-slate-400">Searching…</p>}
            {!isFetching && results.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">No results.</p>
            )}
            <ul className="space-y-3">
              {results.map((r) => (
                <li
                  key={`${r.type}-${r.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.type === 'note'
                          ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {r.type === 'note' ? 'Note' : 'Journal'}
                    </span>
                    <Link
                      to={r.type === 'note' ? `/notes/${r.id}` : `/journal/${r.entryDate}`}
                      className="font-medium text-violet-700 hover:text-violet-900 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      {r.title}
                    </Link>
                  </div>
                  <div
                    className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 [&_b]:font-semibold [&_b]:text-slate-800 dark:[&_b]:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
