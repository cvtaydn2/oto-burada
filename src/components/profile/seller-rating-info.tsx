"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerRatingInfoProps {
  average: number;
  count: number;
  className?: string;
  showLabels?: boolean;
}

export function SellerRatingInfo({ 
  average, 
  count, 
  className,
  showLabels = true 
}: SellerRatingInfoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={cn(
              "transition-all",
              star <= Math.round(average)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-100 text-slate-200"
            )}
          />
        ))}
      </div>
      {showLabels && (
        <div className="flex items-center gap-1 text-xs font-bold italic uppercase tracking-tighter">
          <span className="text-foreground">{average > 0 ? average.toFixed(1) : "Yeni"}</span>
          {count > 0 && (
            <span className="text-muted-foreground">({count} Yorum)</span>
          )}
        </div>
      )}
    </div>
  );
}
