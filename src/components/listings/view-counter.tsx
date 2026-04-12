"use client";

import { useEffect, useState } from "react";
import { Eye, TrendingUp } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useQueryClient } from "@tanstack/react-query";

interface ViewCounterProps {
  listingId: string;
  initialCount: number;
}

export function ViewCounter({ listingId, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);
  const supabase = createSupabaseBrowserClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Increment view count via RPC
    const incrementView = async () => {
      try {
        // Simple client-side storage to avoid excessive increments in same session
        const viewedKey = `voted_${listingId}`;
        const lastViewed = localStorage.getItem(viewedKey);
        const now = Date.now();
        
        // If not viewed in last hour in this browser session
        if (!lastViewed || now - parseInt(lastViewed) > 3600000) {
          await supabase.rpc("increment_listing_view", {
            target_listing_id: listingId
          });
          localStorage.setItem(viewedKey, now.toString());
        }
      } catch (err) {
        console.error("Failed to increment view:", err);
      }
    };

    incrementView();

    // 2. Subscribe to Realtime updates for this listing
    const channel = supabase
      .channel(`listing-views-${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listingId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.view_count === "number") {
            setCount(payload.new.view_count);
            // Optionally invalidate queries if needed, but we have local state
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId, initialCount, supabase]);

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
