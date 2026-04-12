import { Zap, Clock, MessageCircle } from "lucide-react";

interface ResponseTimeBadgeProps {
  sellerId: string;
}

export function ResponseTimeBadge({ sellerId }: ResponseTimeBadgeProps) {
  // Normally this would be fetched from database. For MVP we simulate based on sellerId hash.
  const hash = sellerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const responseMinutes = (hash % 45) + 5; // 5 to 50 minutes
  
  const isFast = responseMinutes < 15;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border tabular-nums transition-all ${
      isFast 
        ? "bg-amber-50 border-amber-100 text-amber-700 shadow-sm" 
        : "bg-slate-50 border-slate-100 text-slate-600"
    }`}>
      {isFast ? (
        <Zap size={14} className="fill-amber-500 text-amber-500 animate-pulse" />
      ) : (
        <Clock size={14} />
      ) }
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black uppercase tracking-widest italic">Yanıt Hızı</span>
        <span className="text-xs font-black italic">~{responseMinutes} Dakika</span>
      </div>
    </div>
  );
}
