"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
}

export function SimplePagination({ currentPage, totalPages }: SimplePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-xl border-slate-200 font-bold"
      >
        <ChevronLeft size={16} className="mr-1" />
        Önceki
      </Button>
      
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SAYFA</span>
        <span className="text-sm font-black text-slate-800">{currentPage} / {totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-xl border-slate-200 font-bold"
      >
        Sonraki
        <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
}
