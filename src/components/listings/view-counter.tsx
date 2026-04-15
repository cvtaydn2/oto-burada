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
      // 1. Increment view count
      const viewedKey = `voted_${listingId}`;
      const lastViewed = localStorage.getItem(viewedKey);
      const now = Date.now();
      
      if (!lastViewed || now - parseInt(lastViewed) > 3600000) {
        try {
          await supabase.rpc("increment_listing_view", { target_listing_id: listingId });
          localStorage.setItem(viewedKey, now.toString());
        } catch {
          // View increment failed silently — non-critical
        }
      }

      // 2. Setup Realtime Channel
      const channelName = `lv_${listingId.slice(0, 8)}`;
      
      // Attempt to clean up any existing instance of this channel
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
