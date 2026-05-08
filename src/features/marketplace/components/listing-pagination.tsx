"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/features/ui/components/button";
import { cn } from "@/lib";

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
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div className="space-y-1 text-center sm:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="text-foreground">
            {(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, totalListings)}
          </span>{" "}
          / <span className="text-foreground">{totalListings}</span> ilan
        </p>
        <p className="text-xs text-muted-foreground">
          Sayfa {currentPage} / {totalPages}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <Button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm transition hover:bg-primary/5 hover:text-primary disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </Button>
        <div className="mx-1 flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto px-1 py-1 sm:mx-2 sm:flex-initial sm:overflow-visible sm:px-0">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "…" ? (
                <span
                  key={`e-${idx}`}
                  className="flex h-11 min-w-8 items-center justify-center px-1 text-sm font-bold text-muted-foreground/40"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  onClick={() => onPageChange(item as number)}
                  className={cn(
                    "flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all shadow-sm",
                    item === currentPage
                      ? "z-10 scale-105 bg-primary text-primary-foreground shadow-primary/20"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {item}
                </Button>
              )
            )}
        </div>
        <Button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm transition hover:bg-primary/5 hover:text-primary disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}
