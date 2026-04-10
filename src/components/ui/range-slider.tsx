"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin?: number;
  valueMax?: number;
  onChangeMin: (value: number | undefined) => void;
  onChangeMax: (value: number | undefined) => void;
  formatLabel?: (value: number) => string;
  unit?: string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  formatLabel,
  unit = "",
  className,
}: RangeSliderProps) {
  // Use controlled values directly — no syncing via useEffect
  const currentMin = valueMin ?? min;
  const currentMax = valueMax ?? max;
  const [isDragging, setIsDragging] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedEmit = useCallback(
    (emitMin: number, emitMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeMin(emitMin <= min ? undefined : emitMin);
        onChangeMax(emitMax >= max ? undefined : emitMax);
      }, 300);
    },
    [min, max, onChangeMin, onChangeMax],
  );

  const handleMinChange = (value: number) => {
    const clamped = Math.min(value, currentMax - step);
    debouncedEmit(clamped, currentMax);
  };

  const handleMaxChange = (value: number) => {
    const clamped = Math.max(value, currentMin + step);
    debouncedEmit(currentMin, clamped);
  };

  const minPercent = ((currentMin - min) / (max - min)) * 100;
  const maxPercent = ((currentMax - min) / (max - min)) * 100;

  const format = formatLabel ?? ((v: number) => `${v.toLocaleString("tr-TR")}${unit ? ` ${unit}` : ""}`);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span className="rounded-md bg-slate-100 px-2 py-1">{format(currentMin)}</span>
        <span className="text-slate-400">—</span>
        <span className="rounded-md bg-slate-100 px-2 py-1">{format(currentMax)}</span>
      </div>

      <div className="relative h-6 select-none">
        {/* Track background */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />

        {/* Active track */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className={cn(
            "pointer-events-none absolute top-0 left-0 h-6 w-full appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
            isDragging && "[&::-webkit-slider-thumb]:scale-110",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md",
          )}
          style={{ zIndex: currentMin > max - 10 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className={cn(
            "pointer-events-none absolute top-0 left-0 h-6 w-full appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
            isDragging && "[&::-webkit-slider-thumb]:scale-110",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md",
          )}
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}
