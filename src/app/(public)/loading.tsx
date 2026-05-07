import { ListingGridSkeleton } from "@/features/shared/components/skeletons";

export default function PublicLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted/50" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted/30" />
      </div>
      <ListingGridSkeleton count={8} />
    </div>
  );
}
