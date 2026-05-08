"use client";

import { CheckCircle2, LoaderCircle, Sparkles, XCircle } from "lucide-react";

import { Button } from "@/features/ui/components/button";
import { Label } from "@/features/ui/components/label";

interface BulkActionsProps {
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  activeBulkAction: "approve" | "reject" | null;
  onBulkModeration: (action: "approve" | "reject", ids: string[]) => void;
  selectedListingIds: string[];
  allPendingListingIds: string[];
  bulkNote: string;
  onBulkNoteChange: (val: string) => void;
  pendingListingsCount: number;
}

export function BulkActions({
  selectedCount,
  allSelected,
  onToggleAll,
  activeBulkAction,
  onBulkModeration,
  selectedListingIds,
  allPendingListingIds,
  bulkNote,
  onBulkNoteChange,
  pendingListingsCount,
}: BulkActionsProps) {
  const PRESETS = [
    "Eksik/Düşük Kalite Fotoğraf",
    "Yanıltıcı Bilgi/Fiyat",
    "Uygunsuz İlan Başlığı",
    "Mükerrer İlan",
    "Hatalı Kategori",
    "İletişim Bilgisi Hatalı",
  ];

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-foreground">
              {selectedCount} seçili ilan
            </span>
            <Button
              type="button"
              onClick={onToggleAll}
              className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {allSelected ? "Seçimi temizle" : "Tümünü seç"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Seçili bekleyen ilanları tek hamlede onayla ya da reddet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={activeBulkAction !== null || selectedCount === 0}
            onClick={() => onBulkModeration("approve", selectedListingIds)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {activeBulkAction === "approve" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}{" "}
            Seçilenleri onayla
          </Button>
          <Button
            type="button"
            disabled={activeBulkAction !== null || selectedCount === 0}
            onClick={() => onBulkModeration("reject", selectedListingIds)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {activeBulkAction === "reject" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}{" "}
            Seçilenleri reddet
          </Button>
          <Button
            type="button"
            disabled={activeBulkAction !== null || pendingListingsCount === 0}
            onClick={() => onBulkModeration("approve", allPendingListingIds)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
          >
            <Sparkles className="size-4" /> Tümünü onayla
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Label className="text-xs font-medium text-muted-foreground">Toplu moderasyon notu</Label>
        <div className="mt-2 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              onClick={() => onBulkNoteChange(preset)}
              className="whitespace-nowrap rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {preset}
            </Button>
          ))}
        </div>
        <textarea
          value={bulkNote}
          onChange={(e) => onBulkNoteChange(e.target.value)}
          placeholder="Opsiyonel not..."
          rows={3}
          className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>
    </div>
  );
}
