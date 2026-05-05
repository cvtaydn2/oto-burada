"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface ListingPaginationProps {
  currentPage: number;
  totalPages: number;
  totalListings: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ListingPagination({
  currentPage,
  totalPages,
  totalListings,
  pageSize,
  onPageChange,
}: ListingPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">
        <span className="text-foreground">
          {(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, totalListings)}
        </span>{" "}
        / <span className="text-foreground">{totalListings}</span> İLAN
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="size-11 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-primary/5 hover:text-primary disabled:opacity-30 shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5 mx-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "…" ? (
                <span key={`e-${idx}`} className="px-2 text-muted-foreground/30 font-bold">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => onPageChange(item as number)}
                  className={cn(
                    "size-11 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-sm",
                    item === currentPage
                      ? "bg-primary text-primary-foreground shadow-primary/20 scale-110 z-10"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {item}
                </button>
              )
            )}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="size-11 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-primary/5 hover:text-primary disabled:opacity-30 shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
