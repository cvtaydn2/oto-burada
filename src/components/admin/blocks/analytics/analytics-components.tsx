import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * KPI Card Component
 */
interface KPICardProps {
  label: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  variant: "blue" | "cyan" | "indigo" | "emerald";
  isCurrency?: boolean;
}

export function AnalyticsKPICard({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  variant,
  isCurrency = false 
}: KPICardProps) {
  const variants = {
    blue: "bg-blue-50 text-blue-500",
    cyan: "bg-cyan-50 text-cyan-500",
    indigo: "bg-indigo-50 text-indigo-500",
    emerald: "bg-emerald-50 text-emerald-500",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-slate-500 font-bold">{label}</div>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", variants[variant])}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">
        {isCurrency ? formatCurrency(value as number) : value.toLocaleString("tr-TR")}
      </div>
      <div className="text-xs font-medium text-slate-500 flex items-center">
        <span className={cn("mr-1 flex items-center", change >= 0 ? "text-emerald-500" : "text-rose-500")}>
          {change >= 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
          %{Math.abs(change)}
        </span>
        <span className="text-slate-400">geçen aya göre</span>
      </div>
    </div>
  );
}

/**
 * Trend Chart Component
 */
interface TrendChartProps {
  data: { date: string; listings: number }[];
  activeChart: "line" | "bar";
  onChartTypeChange: (type: "line" | "bar") => void;
}

export function PerformanceTrendChart({ data, activeChart, onChartTypeChange }: TrendChartProps) {
  const maxListings = Math.max(...data.map(t => t.listings), 1);

  return (
    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">İlan Performans Trendi</h2>
          <p className="text-xs text-slate-500 mt-1">Son 6 ay içindeki yeni ve aktif ilan sayısı gelişimi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChartTypeChange("bar")}
            className={cn("p-2 rounded-lg transition-all", activeChart === "bar" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600")}
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => onChartTypeChange("line")}
            className={cn("p-2 rounded-lg transition-all", activeChart === "line" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600")}
          >
            <PieChart size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative min-h-[250px] flex items-end">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 font-bold py-4">
          <span>{maxListings}</span>
          <span>{Math.round(maxListings * 0.75)}</span>
          <span>{Math.round(maxListings * 0.5)}</span>
          <span>{Math.round(maxListings * 0.25)}</span>
          <span>0</span>
        </div>
        
        <div className="ml-10 w-full h-full border-b border-slate-200 relative">
          <div className="absolute top-1/4 w-full border-t border-slate-100 border-dashed" />
          <div className="absolute top-2/4 w-full border-t border-slate-100 border-dashed" />
          <div className="absolute top-3/4 w-full border-t border-slate-100 border-dashed" />
          
          {activeChart === "bar" ? (
            <div className="absolute bottom-0 w-full flex items-end justify-around h-full pb-4 gap-2">
              {data.map((trend, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-blue-500 rounded-t-xl transition-all hover:bg-blue-600 relative group"
                  style={{ height: `${(trend.listings / maxListings) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {trend.listings}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="absolute bottom-0 left-0 w-full h-full bg-blue-500/20 rounded-t-xl"
              style={{
                clipPath: `polygon(0 100%, ${data.map((t, i) => `${(i / (data.length - 1)) * 100}% ${100 - (t.listings / maxListings) * 100}%`).join(", ")}, 100% 100%)`
              }}
            />
          )}
        </div>
      </div>

      <div className="ml-10 mt-2 flex justify-between text-[10px] text-slate-400 font-bold">
        {data.map((trend, idx) => (
          <span key={idx}>{new Date(trend.date).toLocaleDateString("tr-TR", { month: "short" })}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * Acquisition Panel
 */
interface AcquisitionChannel {
  name: string;
  count: number;
  change: number;
  color: string;
  width: number;
}

export function AcquisitionPanel({ channels }: { channels: AcquisitionChannel[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 mb-1">Kullanıcı Kazanımı</h2>
      <p className="text-xs text-slate-500 mb-6">Kanallara göre yeni kayıtlar.</p>

      <div className="space-y-6 flex-1">
        {channels.map((channel) => (
          <div key={channel.name}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-slate-700">{channel.name}</span>
              <span className="text-xs text-slate-500 font-medium">
                {channel.count} Kayıt 
                <span className={cn("font-bold ml-1", channel.change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {channel.change >= 0 ? "+" : ""}{channel.change}%
                </span>
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className={cn(channel.color, "h-2 rounded-full transition-all")} style={{ width: `${channel.width}%` }} />
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
        Detaylı Kanal Analizi
      </button>
    </div>
  );
}
