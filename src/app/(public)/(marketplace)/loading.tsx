import { Skeleton } from "@/features/ui/components/skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-8 sm:px-4 md:px-6">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl border border-border/50 bg-card/70 p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="hidden min-h-[280px] rounded-2xl bg-muted/30 lg:block" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-40 rounded-full" />
              <Skeleton className="h-12 w-full max-w-xl" />
              <Skeleton className="h-5 w-full max-w-lg" />
              <div className="space-y-3 rounded-2xl border border-border/40 p-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Skeleton className="h-14 w-full rounded-xl sm:w-56" />
                  <Skeleton className="h-14 w-full rounded-xl sm:w-44" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
