"use client";

import { useState } from "react";

import { Button } from "@/features/ui/components/button";

interface DroppedFiltersAlertProps {
  droppedFilters?: string[];
  droppedWarning?: string;
  handleReset: () => void;
}

export function DroppedFiltersAlert({
  droppedFilters,
  droppedWarning,
  handleReset,
}: DroppedFiltersAlertProps) {
  const [showDroppedFilters, setShowDroppedFilters] = useState(true);

  if (!droppedFilters || droppedFilters.length === 0 || !showDroppedFilters) {
    return null;
  }

  return (
    <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-sm text-amber-800">
      <div>
        <div className="font-semibold">Bazı filtreler uygulanmadı</div>
        <div className="mt-1 text-xs text-amber-700/90">
          Desteklenmeyen filtre: {droppedFilters.join(", ")}
        </div>
        {droppedWarning && <div className="mt-1 text-xs text-amber-700/80">{droppedWarning}</div>}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            handleReset();
            setShowDroppedFilters(false);
          }}
          className="h-8 rounded-md bg-amber-600 px-3 text-xs font-semibold text-white"
        >
          Filtreleri Temizle
        </Button>
        <Button
          onClick={() => setShowDroppedFilters(false)}
          className="text-sm text-amber-700/80 underline"
        >
          Kapat
        </Button>
      </div>
    </div>
  );
}
