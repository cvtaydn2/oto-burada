"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic for complex pagination (1 ... 4 5 6 ... 10)
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }

        return pages.map((page, index) => {
            if (page === "...") {
                return (
                    <span key={`dots-${index}`} className="flex size-10 items-center justify-center text-slate-400">
                        <MoreHorizontal size={16} />
                    </span>
                );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                        "flex size-10 items-center justify-center rounded-xl text-sm font-bold transition-all",
                        isActive 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110" 
                            : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    )}
                >
                    {pageNum}
                </button>
            );
        });
    };

    return (
        <nav className={cn("flex items-center justify-center gap-2", className)}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
                <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1.5">
                {renderPageNumbers()}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
                <ChevronRight size={18} />
            </button>
        </nav>
    );
}
