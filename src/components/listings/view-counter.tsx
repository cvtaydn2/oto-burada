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
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const setup = async () => {
      // View kaydı server-side recordListingView ile yapılıyor (listing/[slug]/page.tsx)
      // Burada sadece realtime güncellemeleri dinliyoruz

      const channelName = `lv_${listingId.slice(0, 8)}`;
      
      const existingChannel = supabase.getChannels().find((c: { name: string }) => c.name === channelName);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      channel = supabase
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
            const newRecord = payload.new as { view_count?: number } | null;
            if (newRecord && typeof newRecord.view_count === "number") {
              setCount(newRecord.view_count);
            }
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
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
