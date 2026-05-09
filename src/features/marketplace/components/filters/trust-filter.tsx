"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrustFilterProps {
  hasExpertReport?: boolean;
  maxTramer?: number;
  onExpertReportChange: (v?: boolean) => void;
  onMaxTramerChange: (v?: number) => void;
  hideLabel?: boolean;
}

export function TrustFilter({
  hasExpertReport,
  maxTramer,
  onExpertReportChange,
  onMaxTramerChange,
  hideLabel,
}: TrustFilterProps) {
  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      <div className="space-y-2">
        {!hideLabel && (
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Tramer
          </Label>
        )}
        <Input
          type="number"
          min={0}
          placeholder="Maks tramer tutarı"
          value={maxTramer ?? ""}
          onChange={(e) => onMaxTramerChange(e.target.value ? Number(e.target.value) : undefined)}
          className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <Label className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-4 py-3 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/20 transition-colors">
        <input
          type="checkbox"
          checked={hasExpertReport === true}
          onChange={() => onExpertReportChange(hasExpertReport ? undefined : true)}
          className="rounded border-border"
        />
        Ekspertiz raporlu ilanlar
      </Label>
    </div>
  );
}
