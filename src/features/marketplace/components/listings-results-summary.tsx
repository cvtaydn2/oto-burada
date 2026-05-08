"use client";

import { Label } from "@/features/ui/components/label";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

interface ListingsResultsSummaryProps {
  total: number;
  visibleStart: number;
  visibleEnd: number;
  currentLimit: number;
  handlePageSizeChange: (limit: number) => void;
}

export function ListingsResultsSummary({
  total,
  visibleStart,
  visibleEnd,
  currentLimit,
  handlePageSizeChange,
}: ListingsResultsSummaryProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      aria-live="polite"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Toplam <span className="font-bold text-foreground">{total.toLocaleString("tr-TR")}</span>{" "}
          ilan
        </p>
        <p className="text-xs text-muted-foreground/80">
          {visibleStart > 0
            ? `${visibleStart} - ${visibleEnd} arası sonuçlar gösteriliyor`
            : "Sonuç bulunamadı"}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Label
          htmlFor="listing-page-size"
          className="text-xs font-semibold tracking-wide text-muted-foreground"
        >
          Sayfada
        </Label>
        <select
          id="listing-page-size"
          value={currentLimit}
          onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          className="h-9 min-w-[90px] rounded-lg border border-border bg-card px-2 text-sm font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 sm:px-3"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} / sayfa
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
