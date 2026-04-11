import Link from "next/link";
import {
  BadgeCheck,
  FileClock,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  AdminListingsModeration,
} from "@/components/listings/admin-listings-moderation";
import {
  AdminRecentActions,
  type AdminRecentActionItem,
} from "@/components/listings/admin-recent-actions";
import { AdminReportsModeration } from "@/components/listings/admin-reports-moderation";
import { AdminBroadcastPanel } from "@/components/shared/admin-broadcast-panel";
import { AdminPersistencePanel } from "@/components/shared/admin-persistence-panel";
import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
import { AdminAnalyticsPanel } from "@/components/listings/admin-analytics-panel";
import { getUserRole, requireAdminUser } from "@/lib/auth/session";
import { getRecentAdminModerationActions } from "@/services/admin/moderation-actions";
import { getPersistenceHealth } from "@/services/admin/persistence-health";
import { getAdminAnalytics } from "@/services/admin/analytics";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";
import { getStoredProfileById } from "@/services/profile/profile-records";
import { getStoredListings } from "@/services/listings/listing-submissions";
import { getStoredReports } from "@/services/reports/report-submissions";


export default async function AdminPage() {
  const user = await requireAdminUser();
  const userRole = getUserRole(user);
  const analyticsData = await getAdminAnalytics();
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
  const listingMetaById = Object.fromEntries(
    knownListings.map((listing) => [
      listing.id,
      {
        slug: listing.slug,
        title: listing.title,
      },
    ]),
  );
  const recentActionItems: AdminRecentActionItem[] = await Promise.all(
    recentActions.map(async (action) => {
      const actorProfile = await getStoredProfileById(action.adminUserId);
      const targetListing =
        action.targetType === "listing"
          ? listingById[action.targetId]
          : listingById[storedReports.find((report) => report.id === action.targetId)?.listingId ?? ""];

      return {
        action,
        actorLabel: actorProfile?.fullName || actorProfile?.id || "Bilinmeyen admin",
        targetHref: targetListing?.slug ? `/listing/${targetListing.slug}` : null,
        targetLabel:
          action.targetType === "listing"
            ? targetListing?.title ?? "Ilan basligi bulunamadi"
            : targetListing
              ? `${targetListing.title} icin rapor`
              : "Rapor hedef ilani bulunamadi",
      };
    }),
  );

  return (
    <main className="bg-muted/40 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                Admin Paneli
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">İlan moderasyon merkezi</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {user.email ?? "Admin kullanici"} hesabiyla giris yaptin. Bu alan yalnizca{" "}
                {userRole} rolundeki kullanicilar icin aciktir.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Kullanıcı paneline dön
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5 text-foreground">
            <DashboardMetricCard
              label="Bekleyen ilan"
              value={String(pendingListings.length)}
              helper="Yayina alinmadan once gozden gecirilecek ilanlar."
              icon={FileClock}
              tone="amber"
            />
            <DashboardMetricCard
              label="Onaylanan ilan"
              value={String(approvedListings.length)}
              helper="Yayinda olan ve moderasyon filtresini gecen ilanlar."
              icon={BadgeCheck}
              tone="emerald"
            />
            <DashboardMetricCard
              label="Reddedilen ilan"
              value={String(rejectedListings.length)}
              helper="Kurallara uymadigi icin geri cevrilen ilanlar."
              icon={ShieldAlert}
              tone="slate"
            />
            <DashboardMetricCard
              label="Acil rapor"
              value={String(actionableReports.length)}
              helper="Acik veya incelemede olan guvenlik bildirimleri."
              icon={TriangleAlert}
              tone="amber"
            />
            <DashboardMetricCard
              label="Toplam rapor"
              value={String(storedReports.length)}
              helper="Tum kullanici raporlari bu toplam sayiya dahildir."
              icon={ShieldCheck}
              tone="indigo"
            />
          </div>
        </section>

        {analyticsData && <AdminAnalyticsPanel data={analyticsData} />}

        <AdminPersistencePanel health={persistenceHealth} />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <AdminRecentActions actions={recentActionItems} />
          <AdminBroadcastPanel />
        </div>

        <AdminListingsModeration pendingListings={pendingListings} />
        <AdminReportsModeration
          listingMetaById={listingMetaById}
          reports={actionableReports}
        />
      </div>
    </main>
  );
}
