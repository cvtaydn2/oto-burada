import { redirect } from "next/navigation";
import { getAdminAnalytics } from "@/services/admin/analytics";
import { requireAdminUser } from "@/lib/auth/session";
import { AdminAnalyticsClient } from "@/components/admin/admin-analytics-client";

export const dynamic = "force-dynamic";

interface AdminAnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  await requireAdminUser();
  const { range = "30d" } = await searchParams;
  const analyticsData = await getAdminAnalytics();

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-500 font-medium">Analitik verileri yüklenemedi.</p>
          <p className="text-slate-400 text-sm mt-2">Lütfen Supabase bağlantınızı kontrol edin.</p>
        </div>
      </div>
    );
  }

  const handleTimeRangeChange = (newRange: string) => {
    redirect(`/admin/analytics?range=${newRange}`);
  };

  return <AdminAnalyticsClient data={analyticsData} timeRange={range} onTimeRangeChange={handleTimeRangeChange} />;
}