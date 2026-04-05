import Link from "next/link";

import {
  AdminListingsModeration,
} from "@/components/listings/admin-listings-moderation";
import {
  AdminRecentActions,
  type AdminRecentActionItem,
} from "@/components/listings/admin-recent-actions";
import { AdminReportsModeration } from "@/components/listings/admin-reports-moderation";
import { AdminPersistencePanel } from "@/components/shared/admin-persistence-panel";
import { getUserRole, requireAdminUser } from "@/lib/auth/session";
import { getRecentAdminModerationActions } from "@/services/admin/moderation-actions";
import { getPersistenceHealth } from "@/services/admin/persistence-health";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";
import { getStoredListings } from "@/services/listings/listing-submissions";
import { getStoredReports } from "@/services/reports/report-submissions";

export default async function AdminPage() {
  const user = await requireAdminUser();
  const userRole = getUserRole(user);
  const storedListings = await getStoredListings();
  const storedReports = await getStoredReports();
  const pendingListings = storedListings.filter((listing) => listing.status === "pending");
  const approvedListings = storedListings.filter((listing) => listing.status === "approved");
  const rejectedListings = storedListings.filter((listing) => listing.status === "rejected");
  const actionableReports = storedReports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  );
  const knownListings = await getAllKnownListings();
  const persistenceHealth = await getPersistenceHealth();
  const recentActions = await getRecentAdminModerationActions();
  const listingById = Object.fromEntries(knownListings.map((listing) => [listing.id, listing]));
  const listingTitleById = Object.fromEntries(knownListings.map((listing) => [listing.id, listing.title]));
  const recentActionItems: AdminRecentActionItem[] = recentActions.map((action) => {
    const targetListing =
      action.targetType === "listing"
        ? listingById[action.targetId]
        : listingById[storedReports.find((report) => report.id === action.targetId)?.listingId ?? ""];

    return {
      action,
      targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
      targetLabel:
        action.targetType === "listing"
          ? targetListing?.title ?? "Ilan basligi bulunamadi"
          : targetListing
            ? `${targetListing.title} icin rapor`
            : "Rapor hedef ilani bulunamadi",
    };
  });

  return (
    <main className="bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                Admin Paneli
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">Ilan moderasyon merkezi</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {user.email ?? "Admin kullanici"} hesabiyla giris yaptin. Bu alan yalnizca{" "}
                {userRole} rolundeki kullanicilar icin aciktir.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Kullanici paneline don
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
              <p className="text-sm text-muted-foreground">Bekleyen ilan</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{pendingListings.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
              <p className="text-sm text-muted-foreground">Onaylanan ilan</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{approvedListings.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
              <p className="text-sm text-muted-foreground">Reddedilen ilan</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{rejectedListings.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
              <p className="text-sm text-muted-foreground">Acil rapor</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{actionableReports.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
              <p className="text-sm text-muted-foreground">Toplam rapor</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{storedReports.length}</p>
            </div>
          </div>
        </section>

        <AdminPersistencePanel health={persistenceHealth} />
        <AdminRecentActions actions={recentActionItems} />

        <AdminListingsModeration pendingListings={pendingListings} />
        <AdminReportsModeration
          listingTitleById={listingTitleById}
          reports={actionableReports}
        />
      </div>
    </main>
  );
}
