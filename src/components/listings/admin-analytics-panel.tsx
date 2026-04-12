"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Users, FileText, TriangleAlert } from "lucide-react";
import type { AdminAnalyticsData } from "@/services/admin/analytics";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface AdminAnalyticsPanelProps {
  data: AdminAnalyticsData;
}

export function AdminAnalyticsPanel({ data }: AdminAnalyticsPanelProps) {
  const statusData = data.listingsByStatus.map((s) => ({
    name: s.status === "approved" ? "Onaylı" : s.status === "pending" ? "Bekleyen" : "Reddedilen",
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kullanıcı"
          value={data.totalUsers}
          icon={Users}
          description="Kayıtlı profil sayısı"
        />
        <StatCard
          title="Toplam İlan"
          value={data.totalListings}
          icon={FileText}
          description="Tüm zamanların ilanları"
        />
        <StatCard
          title="Aktif Rapor"
          value={data.totalReports}
          icon={TriangleAlert}
          description="İnceleme bekleyen şikayetler"
        />
        <StatCard
          title="Büyüme"
          value={`${data.recentTrends[data.recentTrends.length - 1].listings} yeni`}
          icon={TrendingUp}
          description="Son 24 saatteki ilanlar"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Listings by Trend */}
        <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">Son 7 Günlük İlan Akışı</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(val) => val.split("-").slice(1).join("/")}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="listings"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="İlan Sayısı"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listings by Status */}
        <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">İlan Durum Dağılımı</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-medium text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Brands */}
        <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">En Popüler Markalar</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.listingsByBrand} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="brand" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#1e293b" }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0" }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#4f46e5" 
                  radius={[0, 10, 10, 0]} 
                  barSize={20}
                  name="İlan Sayısı"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Cities */}
        <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">Şehir Bazlı Yoğunluk</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.listingsByCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="city" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#1e293b" }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0" }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#10b981" 
                  radius={[0, 10, 10, 0]} 
                  barSize={20}
                  name="İlan Sayısı"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Market Trends (New Section) */}
      <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-lg font-semibold flex items-center gap-2 italic uppercase tracking-tight">
              <TrendingUp className="text-indigo-600" size={20} />
              Piyasa Fiyat Analizi (Marka Bazlı)
           </h3>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Piyasa Ortalamaları</p>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.marketTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="brand" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 13, fontWeight: 700, fill: "#1e293b" }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "#64748b" }} 
                tickFormatter={(val) => `₺${val/1000}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                formatter={(val) => [`₺${new Intl.NumberFormat("tr-TR").format(Number(val))}`, "Ortalama Fiyat"]}
              />
              <Bar 
                dataKey="avgPrice" 
                fill="#4f46e5" 
                radius={[12, 12, 0, 0]} 
                barSize={40}
                className="hover:fill-primary/80 transition-colors"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon size={18} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
