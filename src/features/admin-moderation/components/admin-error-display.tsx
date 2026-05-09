"use client";

import { AlertTriangle } from "lucide-react";

import {} from "@/lib";
import { cn } from "@/lib/utils";

interface AdminErrorDisplayProps {
  error: unknown;
  title?: string;
  className?: string;
}

export function AdminErrorDisplay({
  error,
  title = "Veri Yüklenemedi",
  className,
}: AdminErrorDisplayProps) {
  const message = error instanceof Error ? error.message : "Sistemle bağlantı kurulamadı.";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500",
        className
      )}
    >
      <div className="size-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-5 border border-rose-100 shadow-sm">
        <AlertTriangle size={28} />
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <p className="text-[12px] text-rose-500 font-medium max-w-[280px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}
