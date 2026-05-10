import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import dynamicImport from "next/dynamic";
import { Suspense } from "react";

import { getAdminAnalytics } from "@/features/admin-moderation/services/analytics";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

const AdminAnalyticsClient = dynamicImport(
  () =>
    import("@/features/admin-moderation/components/admin-analytics-client").then((mod) => ({
      default: mod.AdminAnalyticsClient,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Analitik | OtoBurada",
  description:
    "Yönetim paneli analitik görünümünde temel performans, trend ve operasyon metriklerini inceleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/analytics"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminAnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

async function AnalyticsContent({ range }: { range: string }) {
  const analyticsData = await getAdminAnalytics(range);

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card rounded-3xl border border-rose-100 shadow-sm">
        <div className="size-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
          <TrendingUp size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Analitik Verileri Yüklenemedi</h2>
        <p className="text-muted-foreground font-medium mt-2 max-w-md italic">
          Veritabanı bağlantısı veya yetkilendirme ile ilgili bir sorun oluştu.
        </p>
      </div>
    );
  }

  return <AdminAnalyticsClient data={analyticsData} timeRange={range} />;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  await requireAdminUser();
  const { range = "30d" } = await searchParams;

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent range={range} />
    </Suspense>
  );
}
