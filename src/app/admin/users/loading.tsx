export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-6 p-6">
              <div className="size-12 animate-pulse rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}