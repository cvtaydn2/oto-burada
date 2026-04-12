"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingDown, History } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PriceHistoryItem {
  changed_at: string;
  new_price: number;
  old_price: number | null;
}

interface PriceHistoryChartProps {
  history: PriceHistoryItem[];
  currentPrice: number;
}

export function PriceHistoryChart({ history, currentPrice }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    if (history.length === 0) {
      // If no history, show current price point
      return [
        {
          date: new Date().toISOString(),
          price: currentPrice,
          formattedDate: format(new Date(), "d MMM", { locale: tr }),
        },
      ];
    }

    return history.map((item) => ({
      date: item.changed_at,
      price: Number(item.new_price),
      formattedDate: format(new Date(item.changed_at), "d MMM", { locale: tr }),
    }));
  }, [history, currentPrice]);

  const priceDrop = useMemo(() => {
    if (history.length < 1) return null;
    const initialPrice = Number(history[0].new_price);
    const drop = initialPrice - currentPrice;
    if (drop <= 0) return null;
    const percent = Math.round((drop / initialPrice) * 100);
    return { amount: drop, percent };
  }, [history, currentPrice]);

  if (history.length === 0) return null;

  return (
    <div className="p-8 rounded-[32px] bg-white border border-border card-shadow space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-xs tracking-widest italic">
            <History size={16} />
            Fiyat Geçmişi
          </div>
          <p className="text-sm text-slate-500 font-medium italic">
            Bu ilanın zaman içindeki fiyat değişimi
          </p>
        </div>
        
        {priceDrop && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
               <TrendingDown size={14} />
               <span className="text-xs font-black">%{priceDrop.percent} İndirim</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-[200px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={["auto", "auto"]} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: "16px", 
                border: "none", 
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                padding: "8px 12px"
              }}
              labelStyle={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}
              itemStyle={{ fontSize: "14px", fontWeight: 900, color: "#0f172a" }}
              formatter={(value: any) => [value ? `₺${value.toLocaleString("tr-TR")}` : "", "Fiyat"]}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#4f46e5" 
              strokeWidth={4} 
              dot={{ r: 6, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="pt-4 flex items-center justify-between border-t border-slate-50">
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">İlan Başlangıcı</div>
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Güncel Durum</div>
      </div>
    </div>
  );
}
