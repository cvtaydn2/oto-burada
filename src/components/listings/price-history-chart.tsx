"use client";

import dynamic from "next/dynamic";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatCurrency, safeFormatDate } from "@/lib/utils";
import type { PriceHistoryPoint } from "@/services/listings/listing-price-history";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });

interface PriceHistoryChartProps {
  history: PriceHistoryPoint[];
  currentPrice: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
        {safeFormatDate(label, "dd MMM yyyy")}
      </p>
      <p className="text-lg font-bold text-foreground">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

export function PriceHistoryChart({ history, currentPrice }: PriceHistoryChartProps) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground/70 font-medium">
        Henüz fiyat değişikliği yok
      </div>
    );
  }

  const firstPrice = history[0]?.price ?? currentPrice;
  const changeAmount = currentPrice - firstPrice;
  const changePercent = firstPrice > 0 ? (changeAmount / firstPrice) * 100 : 0;
  const isDown = changeAmount < 0;
  const isUp = changeAmount > 0;

  const chartData = history.map(p => ({
    date: p.date,
    price: p.price,
  }));

  const minPrice = Math.min(...history.map(p => p.price));
  const maxPrice = Math.max(...history.map(p => p.price));
  const padding = (maxPrice - minPrice) * 0.1 || maxPrice * 0.05;

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
          isDown ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
          isUp ? "bg-rose-50 text-rose-700 border border-rose-100" :
          "bg-muted/30 text-muted-foreground border border-border"
        }`}>
          {isDown ? <TrendingDown size={13} /> : isUp ? <TrendingUp size={13} /> : <Minus size={13} />}
          {isDown ? "İndirim" : isUp ? "Artış" : "Sabit"}
          {" "}
          {Math.abs(changePercent).toFixed(1)}%
        </div>
        <span className="text-xs text-muted-foreground/70 font-medium">
          İlk fiyat: <span className="font-bold text-muted-foreground">{formatCurrency(firstPrice)}</span>
        </span>
        <span className="text-xs text-muted-foreground/70 font-medium">
          {history.length - 1} değişiklik
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-40 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDown ? "#10b981" : isUp ? "#ef4444" : "#6366f1"} stopOpacity={0.15} />
                <stop offset="95%" stopColor={isDown ? "#10b981" : isUp ? "#ef4444" : "#6366f1"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
              tickFormatter={(v) => safeFormatDate(v, "dd MMM")}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
              tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isDown ? "#10b981" : isUp ? "#ef4444" : "#6366f1"}
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={{ fill: isDown ? "#10b981" : isUp ? "#ef4444" : "#6366f1", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
