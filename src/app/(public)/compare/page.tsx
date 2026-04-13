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
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
           <div className="mb-3 flex items-center gap-3">
              <Link href="/" className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-transform hover:bg-slate-50">
                 <ChevronLeft className="size-4" />
              </Link>
              <span className="text-xs text-slate-500">Analitik kıyaslama</span>
           </div>
           <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Araç karşılaştırma
           </h1>
           <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {cars.length} farklı aracı dijital verilerle yan yana koyarak en rasyonel seçimi yapın. Merkeze uzak olan araçlar o kategorideki en yüksek performansı temsil eder.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 lg:grid-cols-12 lg:p-7">
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center gap-3">
             <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 size={24} />
             </div>
             <h2 className="text-xl font-semibold text-slate-900">Rasyonel analiz</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            Bu analiz; model yılı, fiyat dengesi, düşük kilometre verileri ve güvenlik parametrelerini birleştirerek size en iyi fiyat/performans indeksini sunar.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {cars.map((car, idx) => {
               const colors = ["bg-slate-900", "bg-rose-500", "bg-emerald-500", "bg-primary"];
               return (
                 <div key={car.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                   <div className={`size-3 rounded-full ${colors[idx % colors.length]} shadow-sm`} />
                   {car.brand} {car.model}
                 </div>
               )
            })}
          </div>
        </div>
        <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-7 lg:p-6">
            <CompareRadarChart cars={cars} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-56 border-b border-slate-200 bg-slate-50 p-5 align-top">
                <div className="text-[10px] font-medium tracking-wide text-slate-500">
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
                    className="group relative border-b border-l border-slate-200 p-5 align-top"
                  >
                    <CompareRemoveButton otherIds={otherIds} />
                    <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
                      {coverImage ? (
                        <Image
                          src={coverImage.url}
                          alt={car.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : null}
                    </div>
                    <div className="mb-1 text-xl font-semibold leading-tight text-slate-900">
                      {car.brand} {car.model}
                    </div>
                    <div className="mb-3 line-clamp-1 text-xs text-slate-500">
                      {car.title}
                    </div>
                    <div className="mb-4 text-2xl font-bold text-slate-900">
                      {formatCurrency(car.price)}
                    </div>
                    <Link
                      href={`/listing/${car.slug}`}
                      className="inline-flex h-9 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-xs font-medium text-white transition-all hover:bg-black"
                    >
                      Detaylı incele
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Best value recommendation */}
            <tr>
              <td className="border-b border-slate-200 bg-emerald-50/50 p-5 text-[10px] font-medium text-emerald-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  SİSTEM ÖNERİSİ
                </div>
              </td>
              {cars.map((car, idx) => (
                <td
                  key={`ai-${car.id}`}
                  className="border-b border-l border-slate-200 bg-emerald-50/20 p-5"
                >
                  {idx === bestValueIndex ? (
                    <div className="flex items-start gap-2 text-xs font-medium leading-relaxed text-emerald-700">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      Fiyat/Performans endeksine göre en mantıklı tercih
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-300">
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
                <td className="border-b border-slate-200 p-5 text-[10px] font-medium text-slate-500 transition-colors group-hover:text-slate-900">
                  {feature.label}
                </td>
                {cars.map((car) => {
                  const value = feature.render(car);
                  const isPositive = value.includes("✓");
                  return (
                    <td
                      key={`${car.id}-${feature.label}`}
                      className={cn(
                        "border-b border-l border-slate-200 p-5 text-sm",
                        isPositive
                          ? "font-semibold text-emerald-600"
                          : "font-medium text-slate-700"
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
                <td className="border-b border-slate-200 bg-rose-50/50 p-5 text-[10px] font-medium text-rose-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    HASAR KAYDI
                  </div>
                </td>
                {cars.map((car) => (
                  <td
                    key={`tramer-warn-${car.id}`}
                    className="border-b border-l border-slate-200 bg-rose-50/20 p-5 text-xs font-medium text-rose-700"
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
