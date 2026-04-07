import { useMemo } from 'react'
import { Dashboard } from '../components/Dashboard'
import { useAuth } from '../auth/useAuth'
import quotes from '../data/quotes.json'

export function HomePage() {
  const { user } = useAuth()

  const quoteOfTheDay = useMemo(() => {
    const today = new Date().toDateString()
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return quotes[seed % quotes.length]
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
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quote of the Day</h2>
        <blockquote className="mt-4 text-lg italic text-slate-700 dark:text-slate-300">
          "{quoteOfTheDay}"
        </blockquote>
      </div>
    </div>
  )
}
