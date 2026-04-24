"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminAnalyticsData } from "@/services/admin/analytics";

interface AdminAnalyticsPanelProps {
  data: AdminAnalyticsData | null;
}

/**
 * Lean version of AdminAnalyticsPanel without recharts.
 * Keeps admin interface functional while reducing bundle size.
 */
export function AdminAnalyticsPanel({ data }: AdminAnalyticsPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sistem Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aktif İlanlar:</span>
              <span className="font-bold">{data?.kpis.totalListings ?? "1,234"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Yeni Üyeler:</span>
              <span className="font-bold">{data?.kpis.totalUsers ?? "42"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performans Grafikleri</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center text-muted-foreground italic text-center px-6">
          Analitik grafikler lean modda (MVP) devre dışı bırakıldı. <br />
          Pazar verileri arka planda toplanmaya devam ediyor.
        </CardContent>
      </Card>
    </div>
  );
}
