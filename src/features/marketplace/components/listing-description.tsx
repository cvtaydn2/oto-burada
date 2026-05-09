"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ListingDescriptionProps {
  description: string;
}

export function ListingDescription({ description }: ListingDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = description.length > 500;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-0 text-left hover:bg-transparent"
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">İlan Açıklaması</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Araç sahibinin paylaştığı detayları inceleyin.
          </p>
        </div>
        {isLong &&
          (isExpanded ? (
            <ChevronUp className="size-5 shrink-0 text-muted-foreground/70" />
          ) : (
            <ChevronDown className="size-5 shrink-0 text-muted-foreground/70" />
          ))}
      </Button>
      <div
        className={`mt-3 border-t border-border/50 pt-3 text-sm leading-7 text-muted-foreground sm:mt-4 sm:pt-4 ${!isExpanded && !isLong ? "" : isExpanded ? "" : "line-clamp-4"}`}
      >
        {/* Strip bare markdown headings (## with no content) that render as noise */}
        <p className="whitespace-pre-wrap break-words">
          {description
            .split("\n")
            .filter((line) => !/^#{1,6}\s*$/.test(line))
            .map((line) => line.replace(/^#{1,6}\s+/, ""))
            .join("\n")
            .trim()}
        </p>
      </div>
    </div>
  );
}
