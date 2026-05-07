import { Skeleton } from "@/features/ui/components/skeleton";

export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
        >
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-1/4 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-8 w-1/2" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Skeleton className="h-11 rounded-2xl" />
              <Skeleton className="h-11 rounded-2xl" />
              <Skeleton className="h-11 rounded-2xl" />
            </div>
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row min-h-[220px] bg-card rounded-2xl border border-border overflow-hidden p-4 sm:p-0 shadow-sm"
        >
          <Skeleton className="aspect-[16/10] sm:aspect-auto sm:w-[320px] shrink-0" />
          <div className="flex-1 p-4 sm:p-8 sm:pl-10 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-1/6 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-8 w-1/3" />
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-100">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
