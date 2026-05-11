import { TrendingUp } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";

export const metadata: Metadata = {
  title: "İstatistikler | OtoBurada Satıcı Paneli",
  description:
    "İlanlarınızın performansını, görüntülenme ve etkileşim istatistiklerini takip edin.",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6 max-w-5xl">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Performans Analizi</h1>
        </div>
        <p className="text-muted-foreground">
          İlanlarınızın erişim gücünü ve potansiyel alıcılarla olan etkileşimlerinizi izleyin.
        </p>
      </div>

      <Suspense fallback={<AnalyticsPageSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}

function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
