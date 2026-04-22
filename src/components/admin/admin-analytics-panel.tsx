"use client";

import dynamic from "next/dynamic";

import { trust } from "@/lib/constants/ui-strings";
import type { AdminAnalyticsData } from "@/services/admin/analytics";

const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface AdminAnalyticsPanelProps {
  data: AdminAnalyticsData | null | undefined;
}

export function AdminAnalyticsPanel({ data }: AdminAnalyticsPanelProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px] text-slate-400 text-sm font-medium italic">
        Analitik verileri yükleniyor veya mevcut değil...
      </div>
    );
  }

  const statusData = (data.listingsByStatus || []).map((s) => ({
    name:
      s.status === "approved"
        ? trust.admin.analyticsStatus.approved
        : s.status === "pending"
          ? trust.admin.analyticsStatus.pending
          : trust.admin.analyticsStatus.rejected,
    value: s.count || 0,
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-6 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-1.5 rounded-full bg-blue-500" />
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
              İlan Durumu Dağılımı
            </h3>
          </div>
          {/* position:relative + explicit min-height — ResponsiveContainer'ın boyut ölçmesi için */}
          <div className="h-[250px] min-w-0 flex-1">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
                Görüntülenecek veri bulunamadı
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-6 min-h-[300px]">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-1.5 rounded-full bg-indigo-500" />
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
              İlan Trendi (Son 7 Gün)
            </h3>
          </div>
          <div className="h-[250px] min-w-0">
            {(data.recentTrends || []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                <LineChart data={data.recentTrends}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
                    tickFormatter={(value) => {
                      try {
                        const date = new Date(value);
                        return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                      } catch {
                        return "";
                      }
                    }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontWeight: "bold",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="listings"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    dot={{ fill: "#4f46e5", strokeWidth: 2, r: 4, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
                Görüntülenecek veri bulunamadı
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-6 min-h-[300px]">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
            Marka Bazlı Kapasite (Top 5)
          </h3>
        </div>
        <div className="h-[250px] min-w-0">
          {(data.listingsByBrand || []).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
              <BarChart
                data={(data.listingsByBrand || []).slice(0, 5)}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
                />
                <YAxis
                  type="category"
                  dataKey="brand"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#475569", fontWeight: "black" }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontWeight: "bold",
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} barSize={32}>
                  {data.listingsByBrand.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#10b981cc"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
              Görüntülenecek veri bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
