"use client";

import { useCallback, useRef, useState } from "react";

import { cn } from "@/features/shared/lib";
import { Input } from "@/features/ui/components/input";

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
  // Local state only used during active drag for smooth UI feedback
  const [dragMin, setDragMin] = useState<number | null>(null);
  const [dragMax, setDragMax] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Display values: use drag state during drag, props otherwise
  const displayMin = isDragging && dragMin !== null ? dragMin : (valueMin ?? min);
  const displayMax = isDragging && dragMax !== null ? dragMax : (valueMax ?? max);

  // Debounced emit to parent (prevents excessive network/URL updates)
  const debouncedEmit = useCallback(
    (emitMin: number, emitMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeMin(emitMin <= min ? undefined : emitMin);
        onChangeMax(emitMax >= max ? undefined : emitMax);
      }, 400);
    },
    [min, max, onChangeMin, onChangeMax]
  );

  const handleMinChange = (value: number) => {
    const clamped = Math.min(value, displayMax - step);
    setDragMin(clamped);
    debouncedEmit(clamped, displayMax);
    setActiveThumb("min");
  };

  const handleMaxChange = (value: number) => {
    const clamped = Math.max(value, displayMin + step);
    setDragMax(clamped);
    debouncedEmit(displayMin, clamped);
    setActiveThumb("max");
  };

  const handleDragStart = (thumb: "min" | "max") => {
    setIsDragging(true);
    setActiveThumb(thumb);
    setDragMin(displayMin);
    setDragMax(displayMax);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragMin(null);
    setDragMax(null);
  };

  const minPercent = ((displayMin - min) / (max - min)) * 100;
  const maxPercent = ((displayMax - min) / (max - min)) * 100;

  const format =
    formatLabel ?? ((v: number) => `${v.toLocaleString("tr-TR")}${unit ? ` ${unit}` : ""}`);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-[13px] font-bold italic text-slate-900 border-b border-slate-100 pb-1.5">
        <span className="flex flex-col">
          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest leading-none mb-1">
            En Az
          </span>
          {format(displayMin)}
        </span>
        <div className="size-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 italic font-bold text-slate-300">
          /
        </div>
        <span className="flex flex-col text-right">
          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest leading-none mb-1">
            En Çok
          </span>
          {format(displayMax)}
        </span>
      </div>

      <div className="relative h-6 select-none flex items-center">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-2 rounded-full bg-slate-100" />

        {/* Active track */}
        <div
          className="absolute h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.2)]"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min thumb */}
        <Input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onMouseDown={() => handleDragStart("min")}
          onMouseUp={handleDragEnd}
          onTouchStart={() => handleDragStart("min")}
          onTouchEnd={handleDragEnd}
          className={cn(
            "pointer-events-none absolute left-0 h-6 w-full appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform",
            "active:[&::-webkit-slider-thumb]:scale-125",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm"
          )}
          style={{ zIndex: activeThumb === "min" ? 10 : 3 }}
        />

        {/* Max thumb */}
        <Input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onMouseDown={() => handleDragStart("max")}
          onMouseUp={handleDragEnd}
          onTouchStart={() => handleDragStart("max")}
          onTouchEnd={handleDragEnd}
          className={cn(
            "pointer-events-none absolute left-0 h-6 w-full appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform",
            "active:[&::-webkit-slider-thumb]:scale-125",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm"
          )}
          style={{ zIndex: activeThumb === "max" ? 10 : 4 }}
        />
      </div>
    </div>
  );
}
