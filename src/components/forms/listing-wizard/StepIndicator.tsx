"use client";

import { cn } from "@/lib/utils";
import { 
  Car, 
  Settings, 
  ShieldCheck,
  CheckCircle2,
  Check
} from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const stepsConfig = [
  { label: "Araç", icon: Car },
  { label: "Detay Başlık", icon: Settings },
  { label: "Kondisyon", icon: ShieldCheck },
  { label: "Medya", icon: CheckCircle2 },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center relative max-w-2xl mx-auto">
        {/* Background Track */}
        <div className="absolute left-0 top-[22px] w-full h-1.5 bg-slate-100 rounded-full z-0" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-0 top-[22px] h-1.5 bg-slate-900 rounded-full z-1 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(15,23,42,0.3)]"
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
                  "size-12 rounded-full flex items-center justify-center transition-all duration-500 ring-[6px] ring-slate-50 shadow-sm",
                  isCompleted ? "bg-emerald-500 text-white" : 
                  isActive ? "bg-slate-900 text-white scale-110 shadow-sm shadow-slate-900/40" : 
                  "bg-white text-slate-300 border border-slate-200"
                )}
              >
                {isCompleted ? <Check size={20} strokeWidth={4} /> : <Icon size={20} strokeWidth={isActive ? 3 : 2} />}
              </div>
              <div className="absolute top-16 whitespace-nowrap text-center">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  isActive ? "text-slate-900 translate-y-0 opacity-100" : 
                  isCompleted ? "text-emerald-600 opacity-80" : "text-slate-300 opacity-60"
                )}>
                  {step.label}
                </span>
                {isActive && (
                  <div className="mt-1 flex justify-center">
                    <div className="size-1 rounded-full bg-slate-900 animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
