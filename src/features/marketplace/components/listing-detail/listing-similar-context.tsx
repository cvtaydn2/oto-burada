import type { Listing } from "@/types";

interface ListingSimilarContextProps {
  currentListing: Listing;
  similarListings: Listing[];
}

function getMedianPrice(prices: number[]) {
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedPrices.length / 2);

  if (sortedPrices.length % 2 === 0) {
    return Math.round((sortedPrices[middleIndex - 1] + sortedPrices[middleIndex]) / 2);
  }

  return sortedPrices[middleIndex];
}

function getAverageMileage(listings: Listing[]) {
  if (listings.length === 0) {
    return null;
  }

  return Math.round(
    listings.reduce((total, listing) => total + listing.mileage, 0) / listings.length
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function getSimilarityReason(currentListing: Listing, similarListings: Listing[]) {
  const sameModelCount = similarListings.filter(
    (listing) => listing.model === currentListing.model
  ).length;
  const sameYearBandCount = similarListings.filter(
    (listing) => Math.abs(listing.year - currentListing.year) <= 1
  ).length;
  const sameCityCount = similarListings.filter(
    (listing) => listing.city === currentListing.city
  ).length;

  if (sameModelCount >= 2) {
    return `${currentListing.brand} ${currentListing.model} çizgisinde, yakın model ve fiyat beklentisi taşıyan araçlar birlikte gösteriliyor.`;
  }

  if (sameYearBandCount >= 2 && sameCityCount >= 2) {
    return `Bu alternatifler aynı marka etrafında, benzer yaş bandı ve ${currentListing.city} pazarındaki yakın koşulları görmek için seçildi.`;
  }

  if (sameCityCount >= 2) {
    return `Liste, ${currentListing.brand} tarafında özellikle ${currentListing.city} içindeki yakın seçenekleri hızlı kıyaslayabilmen için daraltıldı.`;
  }

  return `Bu alternatifler aynı marka etrafında, yıl, fiyat ve kullanım seviyesi bakımından birbirine yakın örnekleri tek bakışta göstermek için seçildi.`;
}

function getDecisionSummary(currentListing: Listing, similarListings: Listing[]) {
  const prices = similarListings
    .map((listing) => listing.price)
    .filter((price) => Number.isFinite(price));
  const hasEnoughPriceContext = prices.length >= 3;
  const medianPrice = hasEnoughPriceContext ? getMedianPrice(prices) : null;
  const averageMileage = getAverageMileage(similarListings);

  if (!hasEnoughPriceContext || medianPrice === null) {
    return {
      tone: "neutral",
      title: "Alternatif bağlamı var, kesin yargı için veri sınırlı",
      description:
        "Mevcut ilanı öne çıkarmak veya geri plana atmak için yeterince güçlü bir fark görünmüyor. Kartlara hızlıca bakıp özellikle kilometre, yıl ve ekspertiz detaylarını birlikte okumak daha sağlıklı olur.",
      chips: [
        `${similarListings.length} benzer ilan`,
        averageMileage ? `ortalama ${formatNumber(averageMileage)} km` : null,
      ].filter(Boolean) as string[],
    } as const;
  }

  const priceDiffRatio = ((currentListing.price - medianPrice) / medianPrice) * 100;
  const mileageDelta = averageMileage === null ? null : currentListing.mileage - averageMileage;

  if (priceDiffRatio <= -6) {
    return {
      tone: "positive",
      title: "Bu ilan ilk bakışta alternatiflere göre daha ulaşılabilir duruyor",
      description:
        "Fiyat medyanı benzerlerin altında kalıyor. Araç geçmişi ve kondisyon tarafında seni rahatsız eden bir sinyal yoksa mevcut ilana devam etmek mantıklı olabilir; yine de alttaki kartlardan bir iki alternatife göz atmak pazarlık çerçevesi kurmana yardımcı olur.",
      chips: [
        `medyana göre yaklaşık %${Math.abs(Math.round(priceDiffRatio))} daha aşağıda`,
        mileageDelta !== null
          ? mileageDelta <= 0
            ? `ortalamadan ${formatNumber(Math.abs(mileageDelta))} km daha düşük`
            : `ortalamadan ${formatNumber(mileageDelta)} km daha yüksek`
          : null,
      ].filter(Boolean) as string[],
    } as const;
  }

  if (priceDiffRatio >= 6) {
    return {
      tone: "caution",
      title: "Alternatiflere bakmak burada ek bağlam sağlayabilir",
      description:
        "Bu ilan fiyat olarak benzerlerin üst bandına yaklaşıyor. Bu fark donanım, bakım veya kondisyonla açıklanabilir; emin olmak için birkaç alternatifi açıp sonra mevcut ilana dönmek daha bilinçli bir karar akışı sunar.",
      chips: [
        `medyana göre yaklaşık %${Math.round(priceDiffRatio)} daha yukarıda`,
        mileageDelta !== null
          ? mileageDelta <= 0
            ? `ortalamadan ${formatNumber(Math.abs(mileageDelta))} km daha düşük`
            : `ortalamadan ${formatNumber(mileageDelta)} km daha yüksek`
          : null,
      ].filter(Boolean) as string[],
    } as const;
  }

  return {
    tone: "balanced",
    title: "Mevcut ilan benzerlerinin genel bandında konumlanıyor",
    description:
      "Fiyat tarafında sert bir ayrışma görünmüyor. Eğer bu ilanın ekspertiz, hasar geçmişi ve satıcı güven sinyalleri beklentine uyuyorsa devam etmek makul; değilse kartlardaki alternatifler küçük farkları görmek için iyi bir ikinci bakış sunar.",
    chips: [
      `medyana yakın fiyat bandı`,
      mileageDelta !== null
        ? mileageDelta <= 0
          ? `ortalamadan ${formatNumber(Math.abs(mileageDelta))} km daha düşük`
          : `ortalamadan ${formatNumber(mileageDelta)} km daha yüksek`
        : null,
    ].filter(Boolean) as string[],
  } as const;
}

export function ListingSimilarContext({
  currentListing,
  similarListings,
}: ListingSimilarContextProps) {
  const similarityReason = getSimilarityReason(currentListing, similarListings);
  const decisionSummary = getDecisionSummary(currentListing, similarListings);

  return (
    <div className="mb-4 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:mb-5 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex w-fit items-center rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Karşılaştırma Bağlamı
          </div>
          <h3 className="text-base font-bold text-foreground sm:text-lg">
            {decisionSummary.title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">{similarityReason}</p>
          <p className="text-sm leading-6 text-muted-foreground">{decisionSummary.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
          {decisionSummary.chips.map((chip) => (
            <span
              key={chip}
              className={
                decisionSummary.tone === "positive"
                  ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800"
                  : decisionSummary.tone === "caution"
                    ? "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800"
                    : decisionSummary.tone === "balanced"
                      ? "inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-800"
                      : "inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground"
              }
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
