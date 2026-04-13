"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  // 1. Local state for immediate UI feedback (smooth movement)
  const [localMin, setLocalMin] = useState(valueMin ?? min);
  const [localMax, setLocalMax] = useState(valueMax ?? max);
  const [isDragging, setIsDragging] = useState(false);
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 2. Sync local state with props when they change (e.g. from outside reset)
  useEffect(() => {
    if (!isDragging) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalMin(valueMin ?? min);
      setLocalMax(valueMax ?? max);
    }
  }, [valueMin, valueMax, min, max, isDragging]);

  // 3. Debounced emit to parent (prevents excessive network/URL updates)
  const debouncedEmit = useCallback(
    (emitMin: number, emitMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeMin(emitMin <= min ? undefined : emitMin);
        onChangeMax(emitMax >= max ? undefined : emitMax);
      }, 500); // 500ms delay for smooth typing/sliding
    },
    [min, max, onChangeMin, onChangeMax],
  );

  const handleMinChange = (value: number) => {
    const clamped = Math.min(value, localMax - step);
    setLocalMin(clamped);
    debouncedEmit(clamped, localMax);
    setActiveThumb("min");
  };

  const handleMaxChange = (value: number) => {
    const clamped = Math.max(value, localMin + step);
    setLocalMax(clamped);
    debouncedEmit(localMin, clamped);
    setActiveThumb("max");
  };

  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  const format = formatLabel ?? ((v: number) => `${v.toLocaleString("tr-TR")}${unit ? ` ${unit}` : ""}`);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-[13px] font-black italic text-slate-900 border-b border-slate-100 pb-1.5">
        <span className="flex flex-col">
           <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">En Az</span>
           {format(localMin)}
        </span>
        <div className="size-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 italic font-black text-slate-300">/</div>
        <span className="flex flex-col text-right">
           <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">En Çok</span>
           {format(localMax)}
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
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onMouseDown={() => { setIsDragging(true); setActiveThumb("min"); }}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => { setIsDragging(true); setActiveThumb("min"); }}
          onTouchEnd={() => setIsDragging(false)}
          className={cn(
            "pointer-events-none absolute left-0 h-6 w-full appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform",
            "active:[&::-webkit-slider-thumb]:scale-125",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-lg",
          )}
          style={{ zIndex: activeThumb === "min" ? 10 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onMouseDown={() => { setIsDragging(true); setActiveThumb("max"); }}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => { setIsDragging(true); setActiveThumb("max"); }}
          onTouchEnd={() => setIsDragging(false)}
          className={cn(
            "pointer-events-none absolute left-0 h-6 w-full appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform",
            "active:[&::-webkit-slider-thumb]:scale-125",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-lg",
          )}
          style={{ zIndex: activeThumb === "max" ? 10 : 4 }}
        />
      </div>
    </div>
  );
}
