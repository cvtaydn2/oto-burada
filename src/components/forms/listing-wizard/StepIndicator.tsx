"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: readonly string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-[2rem] border border-border/80 bg-background p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0 hidden sm:block" />
        
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={label} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isCompleted ? "bg-emerald-500 text-white" : 
                  isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : 
                  "bg-slate-100 text-slate-400"
                )}
              >
                {isCompleted ? <Check size={18} /> : index + 1}
              </div>
              <span className={cn(
                "hidden md:block text-[11px] font-bold uppercase tracking-wider transition-colors",
                isActive ? "text-primary" : "text-slate-400"
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
