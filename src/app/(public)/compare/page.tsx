import type { Metadata } from "next";
import { CheckCircle2, ChevronLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { 
  getMarketplaceListingsByIds 
} from "@/services/listings/marketplace-listings";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { CompareRemoveButton } from "@/components/listings/compare-remove-button";
import { CompareRadarChart } from "@/components/listings/compare-radar-chart";

export const metadata: Metadata = {
  title: "Araç Karşılaştırma",
  description: "Seçtiğiniz araçları yan yana koyarak fiyat, kilometre, yakıt ve diğer özelliklerini karşılaştırın.",
};

interface ComparePageProps {
  searchParams: Promise<{
    ids?: string | string[];
  }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolvedParams = await searchParams;
  let idsToCompare: string[] = [];

  if (resolvedParams.ids) {
    if (Array.isArray(resolvedParams.ids)) {
      idsToCompare = resolvedParams.ids;
    } else {
      idsToCompare = resolvedParams.ids.split(",").filter(Boolean);
    }
  }

  const cars = idsToCompare.length > 0 
    ? await getMarketplaceListingsByIds(idsToCompare)
    : [];

  if (cars.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Karşılaştırılacak araç yok</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          İlan listesinden &quot;Karşılaştır&quot; butonuna tıklayarak araç ekleyin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          İlanlara Git
        </Link>
      </div>
    );
  }

  const features: Array<{
    label: string;
    render: (car: Listing) => string;
  }> = [
    { label: "Fiyat", render: (car) => formatCurrency(car.price) },
    { label: "Yıl", render: (car) => String(car.year) },
    { label: "Paket", render: (car) => car.carTrim || "Belirtilmemiş" },
    { label: "Kilometre", render: (car) => `${formatNumber(car.mileage)} km` },
    { label: "Yakıt", render: (car) => car.fuelType },
    { label: "Vites", render: (car) => car.transmission },
    { label: "Şehir", render: (car) => `${car.city} / ${car.district}` },
    {
      label: "Tramer",
      render: (car) =>
        car.tramerAmount != null
          ? car.tramerAmount === 0
            ? "Hasarsız ✓"
            : formatCurrency(car.tramerAmount)
          : "Belirtilmemiş",
    },
    {
      label: "Hasar Durumu",
      render: (car) => {
        if (!car.damageStatusJson) return "Tamamen Orijinal ✓";
        const paintCount = Object.values(car.damageStatusJson).filter(v => v === "painted").length;
        const changeCount = Object.values(car.damageStatusJson).filter(v => v === "replaced").length;
        if (paintCount === 0 && changeCount === 0) return "Orijinal ✓";
        return `${paintCount} Boyalı, ${changeCount} Değişen`;
      }
    },
    {
      label: "Ekspertiz",
      render: (car) =>
        car.expertInspection?.hasInspection
          ? "Rapor Mevcut ✓"
          : "Yok",
    },
  ];

  // Best value heuristic: lowest (price / year)
  const bestValueIndex = cars.reduce(
    (best, current, index, arr) =>
      current.price / current.year < arr[best].price / arr[best].year
        ? index
        : best,
    0,
  );

  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-10 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
           <div className="flex items-center gap-4 mb-4">
              <Link href="/" className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform">
                 <ChevronLeft className="size-5" />
              </Link>
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Analitik Kıyaslama</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tightest leading-tight text-slate-900 uppercase italic">
              Araç <span className="text-primary">Karşılaştırma</span>
           </h1>
           <p className="mt-4 text-sm font-medium text-slate-400 italic leading-relaxed">
              {cars.length} farklı aracı dijital verilerle yan yana koyarak en rasyonel seçimi yapın. Merkeze uzak olan araçlar o kategorideki en yüksek performansı temsil eder.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white rounded-[3rem] p-8 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40">
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3">
             <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={24} />
             </div>
             <h2 className="text-2xl font-black italic tracking-tighter uppercase">Rasyonel Analiz</h2>
          </div>
          <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
            Bu analiz; model yılı, fiyat dengesi, düşük kilometre verileri ve güvenlik parametrelerini birleştirerek size en iyi fiyat/performans indeksini sunar.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            {cars.map((car, idx) => {
               const colors = ["bg-slate-900", "bg-rose-500", "bg-emerald-500", "bg-primary"];
               return (
                 <div key={car.id} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-600 italic">
                   <div className={`size-3 rounded-full ${colors[idx % colors.length]} shadow-sm`} />
                   {car.brand} {car.model}
                 </div>
               )
            })}
          </div>
        </div>
        <div className="lg:col-span-7 flex justify-center bg-slate-50/50 rounded-[2.5rem] p-6 lg:p-10 border border-slate-100/50">
            <CompareRadarChart cars={cars} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[3rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-56 bg-slate-50/80 p-8 align-top border-b border-slate-100">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
                  Teknik Parametreler
                </div>
              </th>
              {cars.map((car) => {
                const coverImage =
                  car.images.find((img) => img.isCover) ?? car.images[0];
                const otherIds = cars
                  .filter((c) => c.id !== car.id)
                  .map((c) => c.id)
                  .join(",");

                return (
                  <th
                    key={car.id}
                    className="relative border-b border-l border-slate-100 p-8 align-top group"
                  >
                    <CompareRemoveButton otherIds={otherIds} />
                    <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] bg-slate-100 shadow-xl shadow-slate-200/20">
                      {coverImage ? (
                        <Image
                          src={coverImage.url}
                          alt={car.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : null}
                    </div>
                    <div className="mb-2 text-2xl font-black italic tracking-tightest text-slate-900 leading-tight">
                      {car.brand} {car.model}
                    </div>
                    <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1 italic">
                      {car.title}
                    </div>
                    <div className="mb-6 text-3xl font-black tracking-tighter text-slate-900 italic">
                      {formatCurrency(car.price)}
                    </div>
                    <Link
                      href={`/listing/${car.slug}`}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-6 text-[10px] font-black uppercase text-white tracking-widest transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] italic"
                    >
                      DETAYLI İNCELE
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Best value recommendation */}
            <tr>
              <td className="border-b border-slate-100 bg-emerald-50/50 p-8 font-black uppercase italic tracking-widest text-emerald-600 text-[10px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  SİSTEM ÖNERİSİ
                </div>
              </td>
              {cars.map((car, idx) => (
                <td
                  key={`ai-${car.id}`}
                  className="border-b border-l border-slate-100 bg-emerald-50/20 p-8"
                >
                  {idx === bestValueIndex ? (
                    <div className="flex items-start gap-2 text-xs font-black text-emerald-700 uppercase italic tracking-tighter leading-relaxed">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      Fiyat/Performans endeksine göre en mantıklı tercih
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-300 text-center italic tracking-widest lowercase">
                      —
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Feature rows */}
            {features.map((feature, idx) => (
              <tr
                key={feature.label}
                className={cn("group", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}
              >
                <td className="border-b border-slate-100 p-8 font-black uppercase italic tracking-widest text-slate-400 text-[10px] group-hover:text-slate-900 transition-colors">
                  {feature.label}
                </td>
                {cars.map((car) => {
                  const value = feature.render(car);
                  const isPositive = value.includes("✓");
                  return (
                    <td
                      key={`${car.id}-${feature.label}`}
                      className={cn(
                        "border-b border-l border-slate-100 p-8 text-sm",
                        isPositive
                          ? "font-black text-emerald-600 italic"
                          : "font-bold text-slate-700 italic"
                      )}
                    >
                      {value.replace(" ✓", "")}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Tramer warning row */}
            {cars.some(
              (car) => car.tramerAmount != null && car.tramerAmount > 0,
            ) && (
              <tr>
                <td className="border-b border-slate-100 bg-rose-50/50 p-8 font-black uppercase italic tracking-widest text-rose-600 text-[10px]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    HASAR KAYDI
                  </div>
                </td>
                {cars.map((car) => (
                  <td
                    key={`tramer-warn-${car.id}`}
                    className="border-b border-l border-slate-100 bg-rose-50/20 p-8 text-xs font-black text-rose-700 italic uppercase tracking-tighter"
                  >
                    {car.tramerAmount != null && car.tramerAmount > 0
                      ? `${formatCurrency(car.tramerAmount)} tramer mevcut`
                      : "TEMİZ ARAÇ"}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
