"use client";

import { Label } from "@/components/ui/label";

const PAGE_SIZE_OPTIONS = [12, 24, 48];
const BROAD_RESULTS_THRESHOLD = 60;
const NARROW_RESULTS_THRESHOLD = 8;

interface ListingsResultsSummaryProps {
  total: number;
  visibleStart: number;
  visibleEnd: number;
  currentLimit: number;
  activeFiltersCount: number;
  handlePageSizeChange: (limit: number) => void;
}

function getDiscoveryGuidance(total: number, activeFiltersCount: number) {
  if (total <= NARROW_RESULTS_THRESHOLD) {
    return activeFiltersCount > 0
      ? {
          toneClassName: "border-emerald-200/70 bg-emerald-50/80 text-emerald-900",
          eyebrow: "Sonuçlar netleşti",
          message:
            "Seçenekler daraldı. İlk birkaç ilanı km, fiyat ve ekspertiz detayına göre hızlıca karşılaştırabilirsiniz.",
        }
      : {
          toneClassName: "border-emerald-200/70 bg-emerald-50/80 text-emerald-900",
          eyebrow: "Seçenekler az",
          message:
            "Liste kısa görünüyor. İlk ilanlardan başlayıp fiyat ve durum farklarını hızlıca kontrol edebilirsiniz.",
        };
  }

  if (total >= BROAD_RESULTS_THRESHOLD) {
    return activeFiltersCount > 0
      ? {
          toneClassName: "border-amber-200/80 bg-amber-50/80 text-amber-950",
          eyebrow: "Alan hâlâ geniş",
          message:
            "Sonuçlar fazla. Marka, şehir veya fiyat aralığıyla bir adım daha daraltmak ilk kararı hızlandırabilir.",
        }
      : {
          toneClassName: "border-amber-200/80 bg-amber-50/80 text-amber-950",
          eyebrow: "Başlangıç görünümü geniş",
          message:
            "İlk eleme için marka, şehir veya bütçe filtresi eklemek daha hızlı bir kısa liste oluşturmanıza yardımcı olur.",
        };
  }

  return {
    toneClassName: "border-sky-200/80 bg-sky-50/80 text-sky-950",
    eyebrow: "Karar alanı dengeli",
    message:
      "Sonuç seti sağlıklı görünüyor. İlk ilanları fiyat, km ve ekspertiz bilgisine göre yan yana karşılaştırarak başlayabilirsiniz.",
  };
}

export function ListingsResultsSummary({
  total,
  visibleStart,
  visibleEnd,
  currentLimit,
  activeFiltersCount,
  handlePageSizeChange,
}: ListingsResultsSummaryProps) {
  const guidance = getDiscoveryGuidance(total, activeFiltersCount);

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:gap-4 sm:p-5"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            Toplam{" "}
            <span className="font-bold text-foreground">{total.toLocaleString("tr-TR")}</span> ilan
          </p>
          <p className="text-xs leading-5 text-muted-foreground/80">
            {visibleStart > 0
              ? `${visibleStart} - ${visibleEnd} arası sonuçlar gösteriliyor`
              : "Sonuç bulunamadı"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-3 py-2 sm:justify-start sm:border-0 sm:bg-transparent sm:p-0">
          <Label
            htmlFor="listing-page-size"
            className="text-xs font-semibold tracking-wide text-muted-foreground"
          >
            Sayfada
          </Label>
          <select
            id="listing-page-size"
            value={currentLimit}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="h-9 min-w-[112px] rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / sayfa
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`rounded-2xl border px-3 py-3 sm:px-4 ${guidance.toneClassName}`}
        aria-label="Sonuç rehberi"
      >
        <p className="text-xs font-semibold tracking-wide opacity-80">{guidance.eyebrow}</p>
        <p className="mt-1 text-sm font-medium leading-6">{guidance.message}</p>
      </div>
    </div>
  );
}
