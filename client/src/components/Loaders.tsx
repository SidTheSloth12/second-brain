/**
 * Minimal skeleton loader component for displaying loading states
 * without blocking the UI
 */
export function SkeletonLoader() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Minimal spinner loader for quick loading states
 */
export function MinimalSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-600 dark:border-t-violet-400" />
      </div>
    </div>
  )
}
