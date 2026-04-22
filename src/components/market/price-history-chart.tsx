"use client";

import { useQuery } from "@tanstack/react-query";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface PriceHistoryDataPoint {
  price: number;
  date: string;
  formattedDate?: string;
}

interface PriceHistoryChartProps {
  listingId: string;
  currentPrice: number;
}

export function PriceHistoryChart({ listingId, currentPrice }: PriceHistoryChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["listing-price-history", listingId],
    queryFn: async () => {
      const res = await fetch(`/api/listings/${listingId}/price-history`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-xl" />;
  }

  // If only one point or no points, we can't show a meaningful chart
  // But we can show a flat line from the start if we have at least something
  const chartData =
    data?.length > 0 ? data : [{ price: currentPrice, date: new Date().toISOString() }];

  // Format date for XAxis
  const formattedData = chartData.map((d: PriceHistoryDataPoint) => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString("tr-TR", {
      month: "short",
      day: "numeric",
    }),
  }));

  const firstPrice = formattedData[0].price;
  const lastPrice = currentPrice;
  const priceDiff = lastPrice - firstPrice;
  const isDown = priceDiff < 0;
  const isUp = priceDiff > 0;

  return (
    <Card className="overflow-hidden border-none bg-muted/30 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Fiyat Geçmişi
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {isDown ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="h-3.5 w-3.5" />%
                {Math.abs(Math.round((priceDiff / firstPrice) * 100))} düştü
              </span>
            ) : isUp ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-3.5 w-3.5" />%{Math.round((priceDiff / firstPrice) * 100)}{" "}
                arttı
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Minus className="h-3.5 w-3.5" />
                Sabit
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          {payload[0].payload.formattedDate}
                        </div>
                        <div className="font-bold text-sm">
                          {formatCurrency(payload[0].value as number)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
