import { AdminErrorDisplay } from "@/features/admin-moderation/components/admin-error-display";
import {
  type AdminRecentActionItem,
  AdminRecentActions,
} from "@/features/admin-moderation/components/admin-recent-actions";
import { createSupabaseAdminClient } from "@/lib/admin";
import type { AdminModerationAction, Report } from "@/types";

interface AsyncErrorResult {
  error: string;
}

interface AdminRecentActionsSectionProps {
  recentActionsPromise: Promise<AdminModerationAction[] | AsyncErrorResult>;
  reportsPromise: Promise<Report[] | AsyncErrorResult>;
}

export async function AdminRecentActionsSection({
  recentActionsPromise,
  reportsPromise,
}: AdminRecentActionsSectionProps) {
  const [recentActionsResult, reportsResult] = await Promise.all([
    recentActionsPromise,
    reportsPromise,
  ]);

  if (recentActionsResult && "error" in recentActionsResult) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <AdminErrorDisplay error={recentActionsResult.error} title="Son İşlemler" />
      </div>
    );
  }

  const recentActions = Array.isArray(recentActionsResult) ? recentActionsResult : [];
  const storedReports = Array.isArray(reportsResult) ? reportsResult : [];

  if (recentActions.length === 0) {
    return (
      <div className="rounded-2xl border border-white bg-white p-8 shadow-sm shadow-slate-200/50">
        <AdminRecentActions actions={[]} />
      </div>
    );
  }

  const actorIds = [...new Set(recentActions.map((action) => action.adminUserId))];
  const targetListingIds = [
    ...new Set(
      recentActions
        .filter((action) => action.targetType === "listing")
        .map((action) => action.targetId)
    ),
  ];
  const reportListingIds = recentActions
    .filter((action) => action.targetType === "report")
    .map((action) => storedReports.find((report) => report.id === action.targetId)?.listingId)
    .filter(Boolean) as string[];

  const allListingIds = [...new Set([...targetListingIds, ...reportListingIds])];

  const admin = createSupabaseAdminClient();
  const [actorProfiles, actionListings] = await Promise.all([
    actorIds.length > 0
      ? admin.from("profiles").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
    allListingIds.length > 0
      ? admin.from("listings").select("id, title, slug").in("id", allListingIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const actorsMap = Object.fromEntries(
    (actorProfiles.data || []).map((profile) => [profile.id, profile])
  );
  const listingsMap = Object.fromEntries(
    (actionListings.data || []).map((listing) => [listing.id, listing])
  );

  const recentActionItems: AdminRecentActionItem[] = recentActions.map((action) => {
    const actor = actorsMap[action.adminUserId];
    const listingId =
      action.targetType === "listing"
        ? action.targetId
        : (storedReports.find((report) => report.id === action.targetId)?.listingId ?? null);
    const targetListing = listingId ? listingsMap[listingId] : null;

    return {
      action,
      actorLabel: actor?.full_name || "Sistem",
      targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
      targetLabel:
        targetListing?.title ||
        (action.targetType === "report" ? "Raporlanmış İlan" : "Bilinmeyen İlan"),
    };
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <AdminRecentActions actions={recentActionItems} />
    </div>
  );
}

export function AdminRecentActionsSkeleton() {
  return <div className="h-[640px] animate-pulse rounded-2xl bg-slate-200" />;
}
