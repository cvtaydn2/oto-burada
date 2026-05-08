import type { User } from "@supabase/supabase-js";
import { Suspense } from "react";

import { requireUser } from "@/features/auth/lib/session";
import { DashboardContentSkeleton } from "@/features/dashboard/components/dashboard-content-skeleton";
import { DashboardCreditsCard } from "@/features/dashboard/components/dashboard-credits-card";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardListingsTable } from "@/features/dashboard/components/dashboard-listings-table";
import { DashboardProfessionalCard } from "@/features/dashboard/components/dashboard-professional-card";
import { DashboardQuickLinks } from "@/features/dashboard/components/dashboard-quick-links";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { DashboardVerificationAlert } from "@/features/dashboard/components/dashboard-verification-alert";
import { getDatabaseFavoriteCount } from "@/features/favorites/services/favorite-records";
import { getStoredUserListings } from "@/features/marketplace/services/listing-submissions";
import {
  buildProfileFromAuthUser,
  getStoredProfileById,
} from "@/features/profile/services/profile-records";
import type { Listing, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const listingsPromise = getStoredUserListings(user.id);
  const profilePromise = getStoredProfileById(user.id);
  const favoriteCountPromise = getDatabaseFavoriteCount(user.id);

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-4 py-6 sm:py-8 md:py-10 lg:px-10 lg:py-12 bg-background min-h-screen">
      <DashboardHeader />

      <div className="space-y-10">
        <Suspense fallback={<DashboardContentSkeleton />}>
          <DashboardDataSection
            favoriteCountPromise={favoriteCountPromise}
            listingsPromise={listingsPromise}
            profilePromise={profilePromise}
            user={user}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardDataSection({
  favoriteCountPromise,
  listingsPromise,
  profilePromise,
  user,
}: {
  favoriteCountPromise: Promise<number>;
  listingsPromise: Promise<{ listings: Listing[]; total: number }>;
  profilePromise: Promise<Profile | null>;
  user: User;
}) {
  const [listingsResult, storedProfile, favoriteCount] = await Promise.all([
    listingsPromise,
    profilePromise,
    favoriteCountPromise,
  ]);

  const storedListings = (listingsResult.listings || []) as Listing[];

  const profile = storedProfile ?? buildProfileFromAuthUser(user);
  const pendingCount = storedListings.filter((l: Listing) => l.status === "pending").length;
  const approvedCount = storedListings.filter((l: Listing) => l.status === "approved").length;
  return (
    <div className="space-y-10">
      <DashboardVerificationAlert isEmailVerified={profile?.emailVerified} profile={profile} />

      <DashboardStats
        approvedCount={approvedCount}
        pendingCount={pendingCount}
        favoriteCount={favoriteCount}
        credits={profile?.balanceCredits ?? 0}
      />

      <DashboardProfessionalCard profile={profile} />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardListingsTable listings={storedListings} />
        </div>

        <div className="space-y-10">
          <DashboardCreditsCard credits={profile?.balanceCredits ?? 0} />
          <DashboardQuickLinks />
        </div>
      </div>
    </div>
  );
}
