import { TrendingUp, Car } from "lucide-react";
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
  const analyticsData = await getAdminAnalytics(range);

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl border border-rose-100 shadow-sm">
        <div className="size-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
          <TrendingUp size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800">Analitik Verileri Yüklenemedi</h2>
        <p className="text-slate-500 font-medium mt-2 max-w-md italic">Veritabanı bağlantısı veya yetkilendirme ile ilgili bir sorun oluştu. Lütfen bağlantılarınızı kontrol edin.</p>
      </div>
    );
  }

  return <AdminAnalyticsClient data={analyticsData} timeRange={range} />;
}