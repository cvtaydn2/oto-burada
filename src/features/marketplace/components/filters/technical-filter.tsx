"use client";

import {
  fuelTypeLabels,
  fuelTypes,
  transmissionTypeLabels,
  transmissionTypes,
} from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type { ListingFilters } from "@/types";

interface TechnicalFilterProps {
  fuelType?: ListingFilters["fuelType"];
  transmission?: ListingFilters["transmission"];
  onFuelChange: (v?: ListingFilters["fuelType"]) => void;
  onTransmissionChange: (v?: ListingFilters["transmission"]) => void;
  hideLabel?: boolean;
}

export function TechnicalFilter({
  fuelType,
  transmission,
  onFuelChange,
  onTransmissionChange,
  hideLabel,
}: TechnicalFilterProps) {
  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      <div className="space-y-3">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Yakıt Tipi
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {fuelTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                onFuelChange(fuelType === type ? undefined : (type as ListingFilters["fuelType"]))
              }
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                fuelType === type
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/30"
              )}
            >
              {fuelTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Vites
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {transmissionTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                onTransmissionChange(
                  transmission === type ? undefined : (type as ListingFilters["transmission"])
                )
              }
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                transmission === type
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/30"
              )}
            >
              {transmissionTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
