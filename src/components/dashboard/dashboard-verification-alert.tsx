import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardVerificationAlertProps {
  isVerified?: boolean;
}

export function DashboardVerificationAlert({ isVerified }: DashboardVerificationAlertProps) {
  if (isVerified) return null;

  return (
    <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-destructive/5 p-6 text-destructive border border-destructive/10 md:flex-row animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="text-base font-bold tracking-tight">E-posta Adresini Doğrula</h4>
          <p className="text-xs font-medium opacity-70 mt-1 max-w-lg leading-relaxed">İlan verebilmek ve tüm özellikleri kullanabilmek için e-posta doğrulamanız gerekiyor.</p>
        </div>
      </div>
      <Button variant="destructive" size="sm" className="rounded-xl h-11 px-8 font-bold text-[10px] tracking-widest uppercase shadow-sm shadow-destructive/20 active:scale-95 transition-all" asChild>
        <Link href="/dashboard/profile">DOĞRULA</Link>
      </Button>
    </section>
  );
}
