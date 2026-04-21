"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminUserHeaderProps {
  userId: string;
  fullName: string;
  userType: string;
  isBanned: boolean;
  role: string;
}

export function AdminUserHeader({ userId, fullName, userType, isBanned, role }: AdminUserHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="group rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-900 hover:text-white ">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">
            {fullName || "İsimsiz Kullanıcı"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
              <Store size={12} strokeWidth={3} />
              {userType === "professional" ? "Kurumsal Üye" : "Bireysel Üye"}
            </div>
            <span className="text-[10px] text-slate-300 font-mono tracking-tighter">
              #{userId.substring(0, 12)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn(
          "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
          isBanned 
            ? "bg-rose-50 text-rose-600 border-rose-100" 
            : "bg-emerald-50 text-emerald-600 border-emerald-100"
        )}>
          <div className={cn("size-2 rounded-full", isBanned ? "bg-rose-500" : "bg-emerald-500 animate-pulse")} />
          {isBanned ? "YASAKLI" : "HESAP AKTİF"}
        </div>
        <div className={cn(
          "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
          role === "admin" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"
        )}>
          <ShieldCheck size={14} strokeWidth={3} />
          {role === "admin" ? "SİSTEM ADMİN" : "STANDART YETKİ"}
        </div>
      </div>
    </div>
  );
}
