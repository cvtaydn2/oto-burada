"use client";

import { Clock3, LifeBuoy, MessageSquareReply, Search, ShieldCheck } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TicketStatus } from "@/features/support/services/ticket-service";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "İnceleniyor" },
  { value: "resolved", label: "Çözüldü" },
  { value: "closed", label: "Kapatıldı" },
];

interface AdminTicketListHeaderProps {
  totalCount: number;
  openCount: number;
  resolvedCount: number;
  repliedCount: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filter: TicketStatus | "all";
  onFilterChange: (val: TicketStatus | "all") => void;
  filteredCount: number;
  statusCounts: Record<TicketStatus, number>;
}

export const AdminTicketListHeader = React.memo(function AdminTicketListHeader({
  totalCount,
  openCount,
  resolvedCount,
  repliedCount,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  filteredCount,
  statusCounts,
}: AdminTicketListHeaderProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Operasyon görünümü
            </p>
            <h4 className="mt-1 text-sm font-semibold text-foreground">
              Kuyruk, durum ve yanıt sinyalleri aynı yüzeyde toplandı.
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            <SummaryPill icon={LifeBuoy} label="Toplam" value={totalCount} tone="default" />
            <SummaryPill icon={Clock3} label="Açık" value={openCount} tone="warning" />
            <SummaryPill icon={ShieldCheck} label="Çözüldü" value={resolvedCount} tone="success" />
            <SummaryPill
              icon={MessageSquareReply}
              label="Yanıtlandı"
              value={repliedCount}
              tone="info"
            />
          </div>
        </div>

        <div className="w-full max-w-xl space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Konu, açıklama veya sorun tipi ara..."
              className="h-11 rounded-xl border-border/70 bg-background pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Toplam <span className="font-semibold text-foreground">{filteredCount}</span> kayıt
            gösteriliyor. Yanıt eklemek ilgili kaydı otomatik olarak{" "}
            <span className="font-semibold">İnceleniyor</span> durumuna taşır.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => onFilterChange("all")}
          label={`Tümü (${totalCount})`}
        />
        {STATUS_OPTIONS.map((status) => (
          <FilterChip
            key={status.value}
            active={filter === status.value}
            onClick={() => onFilterChange(status.value)}
            label={`${status.label} (${statusCounts[status.value] ?? 0})`}
          />
        ))}
      </div>
    </div>
  );
});

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const FilterChip = React.memo(function FilterChip({ active, onClick, label }: FilterChipProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 text-xs font-semibold transition-all active:scale-95",
        active
          ? "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
      )}
    >
      {label}
    </Button>
  );
});

interface SummaryPillProps {
  icon: typeof LifeBuoy;
  label: string;
  value: number;
  tone: "default" | "warning" | "success" | "info";
}

const SummaryPill = React.memo(function SummaryPill({
  icon: Icon,
  label,
  value,
  tone,
}: SummaryPillProps) {
  const toneClassName = {
    default: "border-border/70 bg-background text-foreground",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3 shadow-sm transition-all hover:shadow-md",
        toneClassName
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold leading-none">{value}</p>
    </div>
  );
});
