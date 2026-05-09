"use client";

import { Car, Check, CheckCircle2, Settings, ShieldCheck } from "lucide-react";

import {} from "@/lib";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepsConfig = [
  { label: "Araç", icon: Car },
  { label: "Detay Başlık", icon: Settings },
  { label: "Kondisyon", icon: ShieldCheck },
  { label: "Medya", icon: CheckCircle2 },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 md:mb-12 px-2 -mx-2 overflow-x-auto scrollbar-hide">
      <div className="flex justify-between items-center relative min-w-[480px]">
        {/* Background Track */}
        <div className="absolute left-0 top-[22px] w-full h-1.5 bg-slate-100 rounded-full z-0" />

        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-[22px] h-1.5 bg-primary rounded-full z-[1] transition-all duration-700 ease-out"
          style={{ width: `${(currentStep / (stepsConfig.length - 1)) * 100}%` }}
        />

        {stepsConfig.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "size-11 rounded-full flex items-center justify-center transition-all duration-500 ring-4 ring-slate-50 shadow-sm",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-white text-muted-foreground/40 border border-border"
                )}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                )}
              </div>
              <div className="absolute top-16 whitespace-nowrap text-center">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide transition-all duration-300",
                    isActive
                      ? "text-primary opacity-100"
                      : isCompleted
                        ? "text-emerald-600 opacity-80"
                        : "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
