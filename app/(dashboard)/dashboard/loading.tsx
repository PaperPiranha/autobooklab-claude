export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="space-y-1.5">
          <div className="h-5 w-24 rounded-md bg-secondary animate-pulse" />
          <div className="h-4 w-36 rounded-md bg-secondary animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-md bg-secondary animate-pulse" />
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="h-3.5 w-16 rounded bg-secondary animate-pulse" />
                  <div className="h-7 w-10 rounded bg-secondary animate-pulse" />
                </div>
              ))}
            </div>

            {/* Book grid skeleton */}
            <div className="h-4 w-24 rounded bg-secondary animate-pulse mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3 h-36">
                  <div className="h-0.5 w-8 rounded bg-secondary animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
                    <div className="h-3 w-full rounded bg-secondary animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-secondary animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing skeleton */}
          <div className="w-72 shrink-0 hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-20 rounded bg-secondary animate-pulse" />
                  <div className="h-3 w-32 rounded bg-secondary animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
                <div className="h-1.5 w-full rounded-full bg-secondary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
