"use client";

import { Car, Download, MousePointer, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AdminAnalyticsData } from "@/services/admin/analytics";

import {
  AcquisitionPanel,
  AnalyticsKPICard,
  PerformanceTrendChart,
} from "./blocks/analytics/analytics-components";

interface AdminAnalyticsClientProps {
  data: NonNullable<AdminAnalyticsData>;
  timeRange: string;
}

export function AdminAnalyticsClient({
  data,
  timeRange: initialTimeRange,
}: AdminAnalyticsClientProps) {
  const router = useRouter();
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "pie">("bar");
  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    router.push(`/admin/analytics?range=${range}`);
  };

  const dashboardMetrics = useMemo(
    () => ({
      totalListings: data.kpis.totalListings,
      listingsChange:
        data.kpis.previousPeriodListings > 0
          ? Math.round(
              ((data.kpis.totalListings - data.kpis.previousPeriodListings) /
                data.kpis.previousPeriodListings) *
                100
            )
          : 0,
      totalUsers: data.kpis.totalUsers,
      usersChange:
        data.kpis.previousPeriodUsers > 0
          ? Math.round(
              ((data.kpis.totalUsers - data.kpis.previousPeriodUsers) /
                data.kpis.previousPeriodUsers) *
                100
            )
          : 0,
      totalRevenue: data.kpis.totalRevenue,
      revenueChange:
        data.kpis.previousPeriodRevenue > 0
          ? Math.round(
              ((data.kpis.totalRevenue - data.kpis.previousPeriodRevenue) /
                data.kpis.previousPeriodRevenue) *
                100
            )
          : 0,
      pendingApproval: data.kpis.pendingApproval,
    }),
    [data.kpis]
  );

  const channelStats = useMemo(() => {
    const total = data.listingsByCity.reduce((s, c) => s + c.count, 0) || 1;
    return data.listingsByCity.slice(0, 4).map((c, i) => ({
      name: c.city,
      count: c.count,
      change: 0,
      color: ["bg-blue-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-400"][i] ?? "bg-slate-400",
      width: Math.round((c.count / total) * 100),
    }));
  }, [data.listingsByCity]);

  const brandPerformance = useMemo(() => data.listingsByBrand.slice(0, 5), [data.listingsByBrand]);

  const handleExport = () => {
    const csv = [["Tarih", "İlan Sayısı"], ...data.recentTrends.map((t) => [t.date, t.listings])]
      .map((r) => r.join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analitik-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
              Platform İçgörüleri
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Raporlar & <span className="text-indigo-600">Analitik</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium italic">
            Platform performansını ve verilerini buradan takip edin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {range === "7d"
                  ? "7 Gün"
                  : range === "30d"
                    ? "30 Gün"
                    : range === "90d"
                      ? "3 Ay"
                      : "1 Yıl"}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsKPICard
          label="Toplam İlan"
          value={dashboardMetrics.totalListings}
          change={dashboardMetrics.listingsChange}
          icon={MousePointer}
          variant="blue"
        />
        <AnalyticsKPICard
          label="Bekleyen Onay"
          value={dashboardMetrics.pendingApproval}
          change={0}
          icon={Car}
          variant="cyan"
        />
        <AnalyticsKPICard
          label="Toplam Kullanıcı"
          value={dashboardMetrics.totalUsers}
          change={dashboardMetrics.usersChange}
          icon={Users}
          variant="indigo"
        />
        <AnalyticsKPICard
          label="Toplam Gelir"
          value={dashboardMetrics.totalRevenue}
          change={dashboardMetrics.revenueChange}
          icon={Wallet}
          variant="emerald"
          isCurrency
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceTrendChart
          data={data.recentTrends}
          activeChart={activeChart === "pie" ? "bar" : activeChart}
          onChartTypeChange={setActiveChart}
        />
        <AcquisitionPanel
          channels={channelStats}
          title="Şehir Dağılımı"
          description="Aktif ilanların şehirlere göre dağılımı."
          metricLabel="ilan"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Distribution (Placeholder for future expansion) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <div className="w-full text-left mb-6">
            <h2 className="text-lg font-bold text-slate-800">Gelir Dağılımı</h2>
            <p className="text-xs text-slate-500 mt-1">Gelir kaynaklarının oransal görünümü.</p>
          </div>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div
              className="w-full h-full rounded-full border-[24px] border-slate-100 relative"
              style={{
                borderTopColor: "#3b82f6",
                borderRightColor: "#06b6d4",
                borderBottomColor: "#8b5cf6",
                transform: "rotate(45deg)",
              }}
            />
            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center font-bold">
              <span className="text-2xl text-slate-800">100%</span>
              <span className="text-[10px] text-slate-400 uppercase">Toplam</span>
            </div>
          </div>
        </div>

        {/* Top Brands / Galleries Performance */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Marka Performansı</h2>
            <p className="text-xs text-slate-500 mt-1">İlan izlenme ve dönüşüm istatistikleri.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3">Marka</th>
                  <th className="pb-3 text-right">Aktif İlan</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {brandPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 flex items-center font-bold text-slate-800 uppercase tracking-tighter italic">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${idx === 0 ? "bg-blue-500" : "bg-slate-300"}`}
                      />
                      {item.brand}
                    </td>
                    <td className="py-3 text-right text-slate-600 font-bold">
                      {item.count.toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
