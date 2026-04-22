"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Panel } from "@/components/shared/design-system/Panel";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PriceHistoryPoint } from "@/services/listings/listing-price-history";

interface ListingPriceHistoryChartProps {
  history: PriceHistoryPoint[];
}

export function ListingPriceHistoryChart({ history }: ListingPriceHistoryChartProps) {
  if (history.length < 2) return null;

  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const diff = lastPrice - firstPrice;
  const percent = ((diff / firstPrice) * 100).toFixed(1);
  const isDown = diff < 0;
  const isUp = diff > 0;

  const chartData = history.map(p => ({
    price: p.price,
    date: new Date(p.date).toLocaleDateString("tr-TR", { 
      day: "numeric", 
      month: "short" 
    }),
    fullDate: new Date(p.date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }));

  return (
    <Panel padding="xl" className="overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">Fiyat Değişim Grafiği</h2>
          <p className="text-sm text-muted-foreground">İlanın yayınlandığından beri fiyat seyri</p>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
          isDown ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
          isUp ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
          "bg-slate-500/10 border-slate-500/20 text-slate-600"
        }`}>
          {isDown ? <TrendingDown size={18} /> : isUp ? <TrendingUp size={18} /> : <Minus size={18} />}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
              {isDown ? "Fiyat Düştü" : isUp ? "Fiyat Artışı" : "Değişim Yok"}
            </span>
            <span className="text-sm font-black leading-none">
              {isDown || isUp ? `%${Math.abs(Number(percent))}` : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              hide
              domain={["dataMin - 10000", "dataMax + 10000"]}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-2xl shadow-2xl">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{data.fullDate}</p>
                      <p className="text-sm font-black text-foreground">
                        {new Intl.NumberFormat("tr-TR").format(data.price)} TL
                      </p>
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
              strokeWidth={3}
              dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest border-t border-border/40 pt-4">
        <span>İlk Fiyat: {new Intl.NumberFormat("tr-TR").format(firstPrice)} TL</span>
        <span>Son Fiyat: {new Intl.NumberFormat("tr-TR").format(lastPrice)} TL</span>
      </div>
    </Panel>
  );
}
