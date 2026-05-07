import { DashboardHeaderSkeleton, TableSkeleton } from "@/features/shared/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
