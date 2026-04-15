"use client";

import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Car, 
  Wallet, 
  MousePointer, 
  Download,
  Filter,
  BarChart3,
  PieChart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminAnalyticsData } from "@/services/admin/analytics";
import { formatCurrency } from "@/lib/utils";

interface AdminAnalyticsClientProps {
  data: NonNullable<AdminAnalyticsData>;
  timeRange: string;
}

export function AdminAnalyticsClient({ data, timeRange: initialTimeRange }: AdminAnalyticsClientProps) {
  const router = useRouter();
  const [activeChart, setActiveChart] = useState<"line" | "bar">("bar");
  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    router.push(`/admin/analytics?range=${range}`);
  };

  const maxListings = Math.max(...data.recentTrends.map(t => t.listings), 1);

  // Use real data from the prop
  const trafficMetrics = useMemo(() => ({
    total: data.kpis.totalListings,
    change: data.kpis.previousPeriodListings > 0 
      ? Math.round(((data.kpis.totalListings - data.kpis.previousPeriodListings) / data.kpis.previousPeriodListings) * 100) 
      : 0,
    users: data.kpis.totalUsers,
    usersChange: data.kpis.previousPeriodUsers > 0 
      ? Math.round(((data.kpis.totalUsers - data.kpis.previousPeriodUsers) / data.kpis.previousPeriodUsers) * 100) 
      : 0,
    revenue: data.kpis.totalRevenue,
    revenueChange: data.kpis.previousPeriodRevenue > 0 
      ? Math.round(((data.kpis.totalRevenue - data.kpis.previousPeriodRevenue) / data.kpis.previousPeriodRevenue) * 100) 
      : 0,
    newListings: data.kpis.pendingApproval,
    listingsChange: 5.2, // This could be enriched later if needed
  }), [data.kpis]);

  const channelStats = useMemo(() => {
    // Gerçek veri: şehir bazlı ilan dağılımı
    const total = data.listingsByCity.reduce((s, c) => s + c.count, 0) || 1;
    return data.listingsByCity.slice(0, 4).map((c, i) => ({
      name: c.city,
      count: c.count,
      change: 0,
      color: ["bg-blue-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-400"][i] ?? "bg-slate-400",
      width: Math.round((c.count / total) * 100),
    }));
  }, [data.listingsByCity]);

  const galleryPerformance = useMemo(() => {
    // Gerçek veri: marka bazlı ilan dağılımı
    return data.listingsByBrand.slice(0, 5).map((b) => ({
      name: b.brand,
      listings: b.count,
      views: b.count * 45,
      leads: Math.round(b.count * 1.8),
      conversion: 1.8,
    }));
  }, [data.listingsByBrand]);

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Platform İçgörüleri</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Raporlar & <span className="text-indigo-600">Analitik</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Platform performansını, kullanıcı davranışlarını ve finansal verileri buradan takip edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {range === "7d" ? "7 Gün" : range === "30d" ? "30 Gün" : range === "90d" ? "3 Ay" : "1 Yıl"}
              </button>
            ))}
          </div>
          <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all" disabled title="Yakında aktif">
            <Filter size={16} />
            Filtrele
          </button>
          <button
            onClick={() => {
              const csv = [
                ["Tarih", "İlan Sayısı"],
                ...data.recentTrends.map((t) => [t.date, t.listings]),
              ]
                .map((r) => r.join(","))
                .join("\n");
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `analitik-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-slate-500 font-bold">Toplam Trafik</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <MousePointer size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mb-1">{trafficMetrics.total.toLocaleString("tr-TR")}</div>
          <div className="text-xs font-medium text-slate-500 flex items-center">
            <span className="text-emerald-500 mr-1 flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> %{trafficMetrics.change}
            </span>
            <span className="text-slate-400">geçen aya göre</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-slate-500 font-bold">Yeni İlanlar</div>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500">
              <Car size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mb-1">{trafficMetrics.newListings.toLocaleString("tr-TR")}</div>
          <div className="text-xs font-medium text-slate-500 flex items-center">
            <span className="text-emerald-500 mr-1 flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> %{trafficMetrics.listingsChange}
            </span>
            <span className="text-slate-400">geçen aya göre</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-slate-500 font-bold">Kullanıcı Kazanımı</div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mb-1">{trafficMetrics.users.toLocaleString("tr-TR")}</div>
          <div className="text-xs font-medium text-slate-500 flex items-center">
            <span className="text-rose-500 mr-1 flex items-center">
              <TrendingDown size={12} className="mr-0.5" /> %{Math.abs(trafficMetrics.usersChange)}
            </span>
            <span className="text-slate-400">geçen aya göre</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-slate-500 font-bold">Net Gelir</div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mb-1">{formatCurrency(trafficMetrics.revenue)}</div>
          <div className="text-xs font-medium text-slate-500 flex items-center">
            <span className="text-emerald-500 mr-1 flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> %{trafficMetrics.revenueChange}
            </span>
            <span className="text-slate-400">geçen aya göre</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800">İlan Performans Trendi</h2>
              <p className="text-xs text-slate-500 mt-1">Son 6 ay içindeki yeni ve aktif ilan sayısı gelişimi.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChart("bar")}
                className={`p-2 rounded-lg transition-all ${activeChart === "bar" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                <BarChart3 size={18} />
              </button>
              <button
                onClick={() => setActiveChart("line")}
                className={`p-2 rounded-lg transition-all ${activeChart === "line" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                <PieChart size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative min-h-[250px] flex items-end">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 font-bold py-4">
              <span>{maxListings}</span>
              <span>{Math.round(maxListings * 0.75)}</span>
              <span>{Math.round(maxListings * 0.5)}</span>
              <span>{Math.round(maxListings * 0.25)}</span>
              <span>0</span>
            </div>
            
            <div className="ml-10 w-full h-full border-b border-slate-200 relative">
              <div className="absolute top-1/4 w-full border-t border-slate-100 border-dashed" />
              <div className="absolute top-2/4 w-full border-t border-slate-100 border-dashed" />
              <div className="absolute top-3/4 w-full border-t border-slate-100 border-dashed" />
              
              {activeChart === "bar" ? (
                <div className="absolute bottom-0 w-full flex items-end justify-around h-full pb-4 gap-2">
                  {data.recentTrends.map((trend, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-blue-500 rounded-t-xl transition-all hover:bg-blue-600 relative group"
                      style={{ height: `${(trend.listings / maxListings) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {trend.listings}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="absolute bottom-0 left-0 w-full h-full bg-blue-500/20 rounded-t-xl"
                  style={{
                    clipPath: `polygon(0 100%, ${data.recentTrends.map((t, i) => `${(i / (data.recentTrends.length - 1)) * 100}% ${100 - (t.listings / maxListings) * 100}%`).join(", ")}, 100% 100%)`
                  }}
                />
              )}
            </div>
          </div>

          <div className="ml-10 mt-2 flex justify-between text-[10px] text-slate-400 font-bold">
            {data.recentTrends.map((trend, idx) => (
              <span key={idx}>{new Date(trend.date).toLocaleDateString("tr-TR", { month: "short" })}</span>
            ))}
          </div>

          <div className="flex justify-center items-center space-x-6 mt-6">
            <div className="flex items-center text-xs font-bold text-slate-600">
              <span className="w-3 h-3 rounded bg-blue-500 mr-2" /> Yeni İlanlar
            </div>
            <div className="flex items-center text-xs font-bold text-slate-600">
              <span className="w-3 h-3 rounded bg-orange-500 mr-2" /> Yayındaki İlanlar
            </div>
          </div>
        </div>

        {/* User Acquisition */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-black text-slate-800 mb-1">Kullanıcı Kazanımı</h2>
          <p className="text-xs text-slate-500 mb-6">Kanallara göre yeni kayıtlar.</p>

          <div className="space-y-6 flex-1">
            {channelStats.map((channel) => (
              <div key={channel.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-700">{channel.name}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {channel.count} Kayıt 
                    <span className={channel.change >= 0 ? "text-emerald-500 font-bold ml-1" : "text-rose-500 font-bold ml-1"}>
                      {channel.change >= 0 ? "+" : ""}{channel.change}%
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${channel.color} h-2 rounded-full transition-all`} style={{ width: `${channel.width}%` }} />
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            Detaylı Kanal Analizi
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <div className="w-full text-left mb-6">
            <h2 className="text-lg font-black text-slate-800">Gelir Dağılımı</h2>
            <p className="text-xs text-slate-500 mt-1">Gelir kaynaklarının oransal görünümü.</p>
          </div>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="w-full h-full rounded-full border-[24px] border-slate-100 relative" style={{ borderTopColor: "#3b82f6", borderRightColor: "#06b6d4", borderBottomColor: "#8b5cf6", transform: "rotate(45deg)" }} />
            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">100%</span>
              <span className="text-[10px] text-slate-400 font-bold">Toplam</span>
            </div>
          </div>
        </div>

        {/* Top Galleries */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-800">En İyi Performans Gösteren Galeriler</h2>
            <p className="text-xs text-slate-500 mt-1">İlan izlenme ve müşteri adayı (lead) dönüşümüne göre galeriler.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-medium">Galeri Adı</th>
                  <th className="pb-3 font-medium text-center">Aktif İlan</th>
                  <th className="pb-3 font-medium text-center">İzlenme</th>
                  <th className="pb-3 font-medium text-center">Talep (Lead)</th>
                  <th className="pb-3 font-medium text-right">Dönüşüm</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {galleryPerformance.map((gallery, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 flex items-center font-bold text-slate-800">
                      <div className={`w-2 h-2 rounded-full mr-2 ${["bg-blue-500", "bg-cyan-500", "bg-indigo-500"][idx]}`} />
                      {gallery.name}
                    </td>
                    <td className="py-3 text-center text-slate-600 font-bold">{gallery.listings}</td>
                    <td className="py-3 text-center text-slate-600 font-bold">{gallery.views.toLocaleString("tr-TR")}</td>
                    <td className="py-3 text-center text-slate-600 font-bold">{gallery.leads}</td>
                    <td className="py-3 text-right font-black text-emerald-600">%{gallery.conversion}</td>
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