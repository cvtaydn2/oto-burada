"use client";

import { cn } from "@/lib/utils";
import { 
  Car, 
  Settings, 
  Image as ImageIcon, 
  CheckCircle2,
  Check
} from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const stepsConfig = [
  { label: "Temel Bilgiler", icon: Car },
  { label: "Konum & Detaylar", icon: Settings },
  { label: "Ekspertiz & Kondisyon", icon: ImageIcon },
  { label: "Fotoğraflar & Gönder", icon: CheckCircle2 },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
      <div className="flex justify-between items-center relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 z-0" />
        
        {stepsConfig.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center bg-white px-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ring-4 ring-white shadow-sm",
                  isCompleted ? "bg-emerald-500 text-white" : 
                  isActive ? "bg-blue-500 text-white shadow-md" : 
                  "bg-gray-50 text-gray-400 border border-gray-200"
                )}
              >
                {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
              </div>
              <span className={cn(
                "hidden sm:block text-[11px] mt-2 font-bold transition-colors",
                isActive || isCompleted ? "text-gray-800" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
