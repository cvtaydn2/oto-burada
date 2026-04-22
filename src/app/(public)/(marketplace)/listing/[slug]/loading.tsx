export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6 flex h-4 w-48 animate-pulse rounded bg-slate-200" />

      {/* Title & Price Header Mobile Skeleton */}
      <div className="mb-6 space-y-4 lg:hidden">
        <div className="h-8 w-3/4 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-slate-200" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main Content Pane (Left) */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Gallery Skeleton */}
          <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-slate-200 sm:aspect-[16/9]" />
          
          {/* Gallery Thumbnails Skeleton */}
          <div className="flex gap-2.5 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 w-24 shrink-0 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-card border border-border/50 p-4" />
            ))}
          </div>

          {/* Description Block */}
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
          
          {/* Damage Report Skeleton */}
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
        </div>

        {/* Sidebar (Right) */}
        <aside className="w-full shrink-0 space-y-6 lg:max-w-[400px]">
          {/* Title & Price Desktop Header */}
          <div className="hidden space-y-4 lg:block">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 w-2/3 animate-pulse rounded-xl bg-slate-200" />
          </div>

          {/* Seller Card Skeleton */}
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-6 h-14 w-full animate-pulse rounded-2xl bg-indigo-600/20" />
          </div>

          {/* Safety Card Skeleton */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200 mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
