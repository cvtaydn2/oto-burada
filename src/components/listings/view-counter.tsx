"use client";

import { useEffect, useState } from "react";
import { Eye, TrendingUp } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface ViewCounterProps {
  listingId: string;
  initialCount: number;
}

export function ViewCounter({ listingId, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // channelRef ile cleanup garantisi — setup() async olsa bile
    // unmount öncesi oluşturulan channel temizlenir
    const channelName = `lv_${listingId.slice(0, 8)}`;
    let mounted = true;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listingId}`,
        },
        (payload: { new: unknown }) => {
          if (!mounted) return;
          const newRecord = payload.new as { view_count?: number } | null;
          if (newRecord && typeof newRecord.view_count === "number") {
            setCount(newRecord.view_count);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void channel.unsubscribe();
    };
  }, [listingId, supabase]);

  return (
    <div className="flex items-center gap-4 py-2 px-4 rounded-2xl bg-slate-50 border border-slate-100/50 w-fit">
      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight italic">
        <Eye size={14} className="text-primary" />
        <span>Görüntülenme</span>
      </div>
      <div className="flex items-center gap-1.5 font-black text-sm tabular-nums">
        {count.toLocaleString("tr-TR")}
        {count > 100 && (
          <TrendingUp size={14} className="text-emerald-500" />
        )}
      </div>
    </div>
  );
}
