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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export function AuthCinematicPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-slate-950 px-14 py-14 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between xl:px-16 xl:py-16">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(2, 6, 23, 0.94), rgba(2, 6, 23, 0.72)), url("/images/hero_bg.png")',
        }}
      />

      <div className="absolute inset-0">
        <div className="absolute right-[-10%] top-[-10%] h-[45%] w-[45%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-12%] left-[-10%] h-[45%] w-[45%] rounded-full bg-indigo-600/12 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-2xl font-bold tracking-tight text-white"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/20">
            <CarFront size={22} />
          </div>
          OtoBurada
        </Link>
      </div>

      <div className="relative z-10 max-w-xl space-y-7">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/80">
            Güvenli araç pazarı
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Araç ilanlarını daha sade, güvenilir ve mobil odaklı bir deneyimle yönetin.
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-300">
            OtoBurada; moderasyon, net bilgi hiyerarşisi ve WhatsApp öncelikli iletişimle ikinci el
            araç deneyimini daha anlaşılır hale getirir.
          </p>
        </div>

        <div className="space-y-3">
          <FeatureItem
            icon={<ShieldCheck size={18} />}
            title="Moderasyon destekli güven"
            desc="İlanlar daha kontrollü şekilde incelenir, kullanıcılar daha net bir pazar yeri deneyimi yaşar."
          />
          <FeatureItem
            icon={<BadgeCheck size={18} />}
            title="Hızlı iletişim akışı"
            desc="Satıcıya ulaşmak ve ilanlarla ilgilenmek için sade, mobil uyumlu temas noktaları sunar."
          />
        </div>
      </div>

      <div className="relative z-10 text-xs font-medium text-slate-400">© 2026 OtoBurada</div>
    </section>
  );
}
