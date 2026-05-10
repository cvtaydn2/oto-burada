"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ListingPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalListings: number;
  onPageChange: (page: number) => void;
}

export function ListingPagination({
  currentPage,
  totalPages,
  pageSize,
  totalListings,
  onPageChange,
}: ListingPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalListings, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {start}-{end} / {totalListings} ilan gösteriliyor
      </p>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Önceki sayfa"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground">
          Sayfa {currentPage} / {totalPages}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Sonraki sayfa"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
