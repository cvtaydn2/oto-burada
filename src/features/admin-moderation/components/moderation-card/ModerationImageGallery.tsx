"use client";

import { Rocket } from "lucide-react";

import { SafeImage } from "@/components/shared/safe-image";
import { cn, supabaseImageUrl } from "@/lib/utils";
import type { Listing } from "@/types";

interface ModerationImageGalleryProps {
  listing: Listing;
  selectedListingIds: string[];
  toggleListingSelection: (id: string) => void;
}

export function ModerationImageGallery({
  listing,
  selectedListingIds,
  toggleListingSelection,
}: ModerationImageGalleryProps) {
  const isSelected = selectedListingIds.includes(listing.id);

  return (
    <div className="lg:w-64 shrink-0 space-y-6">
      <div
        className="flex items-center gap-4 group cursor-pointer"
        onClick={() => toggleListingSelection(listing.id)}
      >
        <div
          className={cn(
            "size-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
            isSelected
              ? "bg-primary border-primary shadow-lg shadow-primary/20"
              : "border-border group-hover:border-primary/50"
          )}
        >
          {isSelected && <div className="size-2.5 rounded-sm bg-white" />}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
          SEÇİME DAHİL ET
        </span>
      </div>

      <div className="space-y-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-inner group/preview">
          {listing.images?.[0] ? (
            <SafeImage
              src={supabaseImageUrl(listing.images[0].url, 400, 75)}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-700 group-hover/preview:scale-110"
              sizes="256px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Rocket size={32} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover/preview:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/60 to-transparent">
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">
              {listing.images?.length || 0} GÖRSEL
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {listing.images?.slice(1, 4).map((img, i) => (
            <div
              key={img.id || i}
              className="relative aspect-square rounded-xl overflow-hidden border border-border/30 bg-muted/10"
            >
              <SafeImage
                src={supabaseImageUrl(img.url, 200, 75)}
                alt=""
                fill
                className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                sizes="64px"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
