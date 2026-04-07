import { useState, useCallback } from 'react'
import { Dashboard } from '../components/Dashboard'
import { useAuth } from '../auth/useAuth'
import lines from '../data/lines.json'

const STORAGE_KEY = 'lineIndex'

function getInitialIndex(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed < lines.length) return parsed
    }
  } catch {}
  // fallback: seed by today's date
  const seed = new Date().toDateString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return seed % lines.length
}

export function HomePage() {
  const { user } = useAuth()
  const [quoteIndex, setQuoteIndex] = useState<number>(getInitialIndex)
  const [spinning, setSpinning] = useState(false)

  const handleNext = useCallback(() => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 400)
    setQuoteIndex(prev => {
      const next = (prev + 1) % lines.length
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome back!</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Signed in as <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</span>.
        </p>
      </div>

      <Dashboard />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Lines</h2>
          <button
            onClick={handleNext}
            title="Next line"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:text-violet-400 dark:hover:bg-violet-900/20 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.4s ease',
                transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
              }}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Next line
          </button>
        </div>
        <blockquote className="mt-4 text-lg italic text-slate-700 dark:text-slate-300">
          "{lines[quoteIndex]}"
        </blockquote>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 select-none">
          {quoteIndex + 1} / {lines.length}
        </p>
      </div>
    </div>
  )
}
