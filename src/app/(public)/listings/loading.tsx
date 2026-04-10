import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:block w-[280px] shrink-0 space-y-6">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </aside>

        {/* Content Area Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 flex flex-col sm:flex-row items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>

          {/* Grid Skeleton */}
          <ListingsGridSkeleton count={9} />
        </div>
      </div>
    </main>
  );
}
