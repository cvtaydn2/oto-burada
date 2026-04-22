export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 flex items-center gap-2">
          {[80, 60, 80, 120].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`h-3 w-${w === 80 ? "20" : w === 60 ? "16" : w === 120 ? "28" : "20"} animate-pulse rounded bg-muted`}
              />
              {i < 3 && <div className="size-2 rounded-full bg-muted" />}
            </div>
          ))}
        </div>

        {/* Hero grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_360px] lg:gap-8 mb-6 sm:mb-8">
          {/* Gallery + Title */}
          <div className="space-y-4">
            <div className="aspect-[4/3] sm:aspect-[16/9] w-full animate-pulse rounded-2xl bg-muted" />
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded-lg bg-muted" />
              </div>
              <div className="h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
              <div className="flex gap-4 pt-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
            </div>
            {/* Seller card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-12 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-9 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>

        {/* Specs grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 space-y-2 flex flex-col items-center"
            >
              <div className="size-10 animate-pulse rounded-xl bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Content sections */}
        <div className="space-y-6">
          {[200, 300, 180].map((h, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6"
              style={{ height: h }}
            >
              <div className="h-5 w-40 animate-pulse rounded-lg bg-muted mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
