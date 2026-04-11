"use client";

import { ShieldCheck, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EIDSBadgeProps {
  isVerified: boolean;
  className?: string;
}

export function EIDSBadge({ isVerified, className }: EIDSBadgeProps) {
  if (!isVerified) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border">
        <Info size={12} />
        Kimlik Doğrulanmamış
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 cursor-help ${className}`}>
            <ShieldCheck size={14} className="animate-pulse" />
            EİDS DOĞRULANMIŞ
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] p-4 text-xs leading-relaxed">
          <p className="font-bold mb-1">Elektronik İlan Doğrulama Sistemi (EİDS)</p>
          <p>
            Bu ilan sahibi, Ticaret Bakanlığı yönetmeliğine uygun olarak 
            <span className="font-semibold"> e-Devlet</span> üzerinden kimliğini 
            ve araç satış yetkisini doğrulamıştır.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
