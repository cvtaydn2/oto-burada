"use client";

import { Archive, CheckSquare, FileSpreadsheet, Loader2, Square } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/features/ui/components/alert-dialog";
import { Button } from "@/features/ui/components/button";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

interface MyListingsBulkActionsProps {
  allPageSelected: boolean;
  paginatedCount: number;
  selectedCount: number;
  isBulkArchiving: boolean;
  pageSize: number;
  toggleSelectAll: () => void;
  handleBulkArchive: () => void;
  handleBulkDelete: () => void;
  setPageSize: (size: number) => void;
  exportCsv: () => void;
}

export function MyListingsBulkActions({
  allPageSelected,
  paginatedCount,
  selectedCount,
  isBulkArchiving,
  pageSize,
  toggleSelectAll,
  handleBulkArchive,
  handleBulkDelete,
  setPageSize,
  exportCsv,
}: MyListingsBulkActionsProps) {
  return (
    <div className="flex flex-col gap-4 bg-muted/30 p-2 rounded-2xl border border-border/40">
      <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2">
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleSelectAll}
            className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
          >
            {allPageSelected ? (
              <CheckSquare size={20} className="text-primary" />
            ) : (
              <Square size={20} className="text-border" />
            )}
            Tümünü Seç ({paginatedCount})
          </Button>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="w-px h-4 bg-border mx-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={isBulkArchiving}
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-slate-900 border-slate-800 text-white hover:bg-black rounded-xl"
              >
                {isBulkArchiving ? (
                  <Loader2 className="size-3 animate-spin mr-2" />
                ) : (
                  <Archive size={14} className="mr-2" />
                )}
                Arşivle ({selectedCount})
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isBulkArchiving}
                    className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    SİL
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-none p-8">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold tracking-tight">
                      İlanları Kalıcı Sil
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-medium text-muted-foreground mt-2">
                      {selectedCount} ilanı kalıcı olarak silmek istediğinize emin misiniz?
                      Arşivlenmiş olmayan ilanlar silinemez.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-8">
                    <AlertDialogCancel className="rounded-xl h-12 px-6">Vazgeç</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 hover:bg-rose-700 rounded-xl h-12 px-6"
                      onClick={handleBulkDelete}
                    >
                      Kalıcı Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 h-10 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Sayfa:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
              className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest border-border rounded-xl bg-card hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} className="mr-2 text-primary" />
            Excel İndir
          </Button>
        </div>
      </div>
    </div>
  );
}
