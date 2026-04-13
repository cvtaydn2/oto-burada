"use client";

import dynamic from "next/dynamic";
import { TrendingUp, Users, FileText, TriangleAlert } from "lucide-react";
import type { AdminAnalyticsData } from "@/services/admin/analytics";

const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
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
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Analitik verileri yükleniyor veya mevcut değil
      </div>
    );
  }

  const statusData = (data.listingsByStatus || []).map((s) => ({
    name: s.status === "approved" ? "Onaylı" : s.status === "pending" ? "Bekleyen" : "Reddedilen",
    value: s.count || 0,
  }));

  const totalUsers = data.totalUsers ?? 0;
  const totalListings = data.totalListings ?? 0;
  const totalReports = data.totalReports ?? 0;
  const listingTrend = data.listingTrend ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kullanıcı"
          value={totalUsers}
          icon={Users}
          description="Kayıtlı profil sayısı"
        />
        <StatCard
          title="Toplam İlan"
          value={totalListings}
          icon={FileText}
          description="Tüm zamanların ilanları"
        />
        <StatCard
          title="Aktif Rapor"
          value={totalReports}
          icon={TriangleAlert}
          description="İncelemede olan raporlar"
        />
        <StatCard
          title="Gelir Trendi"
          value={`${listingTrend}%`}
          icon={TrendingUp}
          description="Aylık ilan artışı"
          highlight
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">İlan Durumu Dağılımı</h3>
          <div className="h-[200px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Veri yok
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">İlan Trendi (Son 30 Gün)</h3>
          <div className="h-[200px]">
            {(data.recentTrends || []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.recentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(value) => {
                      try {
                        return new Date(value).toLocaleDateString("tr-TR", { day: "numeric" });
                      } catch {
                        return "";
                      }
                    }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="listings" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Veri yok
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">Marka Dağılımı (Top 10)</h3>
        <div className="h-[250px]">
          {(data.listingsByBrand || []).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data.listingsByBrand || []).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis 
                  type="category" 
                  dataKey="brand" 
                  tick={{ fontSize: 10, fill: "#64748b" }} 
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Veri yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, highlight }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
      <div className={`rounded-lg p-2 ${highlight ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-xl font-black text-slate-800">{value}</p>
        <p className="text-[10px] text-slate-500">{description}</p>
      </div>
    </div>
  );
}