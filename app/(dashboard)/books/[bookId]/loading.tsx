export default function BookLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <header className="flex items-start justify-between border-b border-border px-8 py-5">
        <div className="flex items-start gap-4">
          <div className="h-9 w-9 rounded-md bg-secondary animate-pulse mt-0.5" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-secondary animate-pulse" />
            <div className="h-3.5 w-64 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-32 rounded bg-secondary animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-28 rounded-md bg-secondary animate-pulse" />
      </header>

      {/* Chapters skeleton */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-3"
              >
                <div className="h-4 w-4 rounded bg-secondary animate-pulse" />
                <div className="w-5 h-3 rounded bg-secondary animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="h-4 rounded bg-secondary animate-pulse"
                    style={{ width: `${55 + (i * 13) % 35}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          {/* Export skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-secondary animate-pulse" />
              <div className="h-4 w-16 rounded bg-secondary animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 h-20 rounded-lg border border-border bg-card animate-pulse" />
              <div className="flex-1 h-20 rounded-lg border border-border bg-card animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
