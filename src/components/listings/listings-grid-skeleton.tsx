export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background shadow-sm"
        >
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-18 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
