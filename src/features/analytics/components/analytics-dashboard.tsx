"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertCircle,
  BarChart3,
  Car,
  Eye,
  MousePointerClick,
  Percent,
  TrendingUp,
} from "lucide-react";
import React from "react";

import { getDashboardAnalyticsAction } from "@/app/dashboard/analytics/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["seller-analytics"],
    queryFn: () => getDashboardAnalyticsAction(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">İstatistikler yüklenemedi</p>
            <p className="text-sm text-muted-foreground">
              Şu an veriler alınırken bir sorun oluştu.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm font-medium transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Tekrar Dene
          </button>
        </CardContent>
      </Card>
    );
  }

  const { summary, listings, chartData } = data;

  // Calculate values for simplified visual chart representation
  const maxViews = Math.max(...chartData.map((d) => Number(d.views)), 1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Overview Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Toplam Görüntülenme"
          value={summary.total_listing_views}
          description="Tüm ilanların toplam izlenme sayısı"
          icon={<Eye className="w-4 h-4 text-blue-500" />}
        />
        <SummaryCard
          title="İletişim Tıklamaları"
          value={summary.total_contact_clicks}
          description="WhatsApp & Arama buton tıklamaları"
          icon={<MousePointerClick className="w-4 h-4 text-green-500" />}
        />
        <SummaryCard
          title="Ortalama Dönüşüm"
          value={`%${summary.avg_conversion_rate}`}
          description="Tıklama / Görüntülenme oranı"
          icon={<Percent className="w-4 h-4 text-orange-500" />}
          accent={summary.avg_conversion_rate > 2 ? "text-green-500" : ""}
        />
      </div>

      {/* 2. Visual Activity Chart (Tailwind/SVG Mini-Graph) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ziyaretçi Trafiği
              </CardTitle>
              <CardDescription>Son 30 günün görüntülenme istatistikleri</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end w-full h-48 gap-1 px-2 pt-4">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm italic">
                Henüz veri oluşmadı.
              </div>
            ) : (
              chartData.map((item, idx) => {
                const heightPct = (Number(item.views) / maxViews) * 100;
                const finalHeight = Math.max(heightPct, item.views > 0 ? 4 : 0); // Min height for visual

                return (
                  <div
                    key={idx}
                    className="relative flex-1 group flex flex-col items-center h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 z-10 hidden group-hover:flex flex-col items-center px-2 py-1 bg-popover text-popover-foreground border rounded shadow-md text-[10px] whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
                      <span className="font-bold">
                        {format(parseISO(item.activity_date as string), "d MMM", { locale: tr })}
                      </span>
                      <span>{item.views} Görüntülenme</span>
                      {Number(item.contacts) > 0 && (
                        <span className="text-green-500 font-medium">{item.contacts} İletişim</span>
                      )}
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ease-out cursor-pointer ${
                        Number(item.contacts) > 0
                          ? "bg-green-500/80 hover:bg-green-500"
                          : "bg-primary/40 hover:bg-primary"
                      }`}
                      style={{ height: `${finalHeight}%` }}
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between w-full pt-2 text-[10px] text-muted-foreground px-2 border-t mt-1">
            {chartData.length > 0 ? (
              <>
                <span>
                  {format(parseISO(chartData[0].activity_date as string), "d MMM", { locale: tr })}
                </span>
                <span>Ortası</span>
                <span>Bugün</span>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* 3. Listing Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            İlan Performans Analizi
          </CardTitle>
          <CardDescription>İlan bazlı sıralama ve performans dökümü</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground space-y-2">
              <Car className="w-12 h-12 opacity-20" />
              <p>Aktif ilanınız bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-y">
                  <tr>
                    <th className="px-4 py-3 font-medium">İlan Başlığı</th>
                    <th className="px-4 py-3 font-medium text-center">Görüntülenme</th>
                    <th className="px-4 py-3 font-medium text-center">İletişim</th>
                    <th className="px-4 py-3 font-medium text-center">Dönüşüm</th>
                    <th className="px-4 py-3 font-medium text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {listings.map((listing) => {
                    const conversion =
                      listing.view_count > 0
                        ? Math.round((listing.contact_count / listing.view_count) * 100)
                        : 0;
                    return (
                      <tr key={listing.id} className="hover:bg-accent/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {listing.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(listing.created_at), "d MMM yyyy", { locale: tr })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{listing.view_count}</td>
                        <td className="px-4 py-3 text-center font-mono">{listing.contact_count}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={conversion > 5 ? "secondary" : "outline"}
                            className={`${conversion > 5 ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" : ""}`}
                          >
                            %{conversion}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right capitalize">
                          <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                            {listing.status === "active" ? "Yayında" : listing.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  accent?: string;
}

function SummaryCard({ title, value, icon, description, accent = "" }: SummaryCardProps) {
  return (
    <Card className="overflow-hidden relative">
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-muted/10 to-transparent pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-muted/50 rounded-lg">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
