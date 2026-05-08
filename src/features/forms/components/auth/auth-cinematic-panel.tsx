"use client";

import { BadgeCheck, CarFront, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureItem({ icon, title, desc }: FeatureItemProps) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
      <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export function AuthCinematicPanel() {
  return (
    <section className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-slate-950 px-16 py-16 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.6)), url("/images/hero_bg.png")',
        }}
      />

      {/* Abstract Overlays */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-2xl font-bold tracking-tighter text-white"
        >
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
            <CarFront size={22} className="text-white" />
          </div>
          OtoBurada
        </Link>
      </div>

      <div className="relative z-10 max-w-xl space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
            GÜVENLİ PAZARYERİ
          </div>
          <h1 className="text-5xl font-bold leading-[1.2] tracking-tight">
            İkinci Elin <span className="text-primary">En Temiz</span> Hali.
          </h1>
        </div>

        <p className="max-w-md text-lg font-medium leading-relaxed text-slate-400">
          Binlerce güncel ilan, şeffaf ekspertiz verileri ve güven odaklı moderasyon ile
          hayalinizdeki araca ulaşın.
        </p>

        <div className="flex flex-col gap-3">
          <FeatureItem
            icon={<ShieldCheck size={18} />}
            title="Resmi Ekspertiz"
            desc="Sadece doğrulanmış raporlar yayına alınır"
          />
          <FeatureItem
            icon={<BadgeCheck size={18} />}
            title="Hızlı WhatsApp"
            desc="Fiyat teklifi ve randevu tek tıkla elinizde"
          />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-8 text-[10px] font-medium uppercase tracking-widest text-slate-500">
        <span>© 2026 OtoBurada</span>
      </div>
    </section>
  );
}
