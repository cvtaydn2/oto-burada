import { ListingsGridSkeleton } from "@/features/marketplace/components/listings-grid-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <ListingsGridSkeleton count={6} />
      </div>
    </main>
  );
}
