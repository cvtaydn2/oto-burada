import { BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

import type { ListingTrustDecisionSummary } from "@/features/marketplace/lib/trust-ui";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import type { Profile } from "@/types";

import { MarketValuationBadge } from "../market-valuation-badge";

const ContactActions = dynamic(
  () => import("@/features/marketplace/components/contact-actions").then((m) => m.ContactActions),
  { loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" /> }
);

const ReserveButton = dynamic(
  () => import("@/features/reservations/components/reserve-button").then((m) => m.ReserveButton),
  { loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" /> }
);

interface ListingPriceBoxProps {
  listingId: string;
  listingSlug: string;
  sellerId: string;
  seller: Partial<Profile> | null;
  listingTitle: string;
  listingPrice: number;
  currentUserId?: string;
  isOwner: boolean;
  marketValuation: {
    status: "good" | "fair" | "high" | "unknown";
    diff: number;
    avgPrice?: number;
    listingCount?: number | null;
  };
  trustDecision: ListingTrustDecisionSummary;
}

function getPriceComparisonSummary(marketValuation: ListingPriceBoxProps["marketValuation"]) {
  const comparableListingCount = marketValuation.listingCount ?? 0;
  const hasEnoughContext =
    marketValuation.status !== "unknown" &&
    comparableListingCount >= 3 &&
    typeof marketValuation.avgPrice === "number";

  if (!hasEnoughContext) {
    return {
      tone: "belirsiz",
      eyebrow: "Fiyat kıyas özeti",
      title: "Piyasa bağlamı şimdilik sınırlı",
      description:
        "Bu ilan için hızlı fiyat yorumu yapacak kadar güçlü benzer veri görünmüyor. Kararı verirken aşağıdaki detaylı analiz ve ilanın diğer sinyalleriyle birlikte düşünmek daha sağlıklı olur.",
      meta:
        comparableListingCount > 0
          ? `${comparableListingCount} benzer ilanla sınırlı`
          : "Benzer veri henüz sınırlı",
    } as const;
  }

  if (marketValuation.status === "good") {
    return {
      tone: "avantajli",
      eyebrow: "Fiyat kıyas özeti",
      title: "İlk bakışta avantajlı görünüyor",
      description:
        "İlan fiyatı benzer araç ortalamasının altında konumlanıyor. Araç durumu ve detaylar da beklentinle örtüşüyorsa, iletişime geçmek için makul bir başlangıç olabilir.",
      meta: `${comparableListingCount} benzer ilana göre yaklaşık %${marketValuation.diff} aşağıda`,
    } as const;
  }

  if (marketValuation.status === "high") {
    return {
      tone: "yuksek",
      eyebrow: "Fiyat kıyas özeti",
      title: "Piyasa ortalamasının üstünde konumlanıyor",
      description:
        "Bu tek başına olumsuz bir işaret değildir; donanım, kondisyon veya bakım geçmişi fiyatı etkiliyor olabilir. İstersen aşağıdaki analizle bağlamı netleştirip sonra satıcıyla konuşabilirsin.",
      meta: `${comparableListingCount} benzer ilana göre yaklaşık %${marketValuation.diff} yukarıda`,
    } as const;
  }

  return {
    tone: "dengeli",
    eyebrow: "Fiyat kıyas özeti",
    title: "Piyasa seviyesine yakın görünüyor",
    description:
      "İlan fiyatı benzer araçların genel bandına yakın duruyor. Son kararda ekspertiz, hasar geçmişi ve satıcı güven sinyallerine birlikte bakmak faydalı olur.",
    meta: `${comparableListingCount} benzer ilanla dengeli görünüm`,
  } as const;
}

export function ListingPriceBox({
  listingId,
  listingSlug,
  sellerId,
  seller,
  listingTitle,
  listingPrice,
  currentUserId,
  isOwner,
  marketValuation,
  trustDecision,
}: ListingPriceBoxProps) {
  const priceComparisonSummary = getPriceComparisonSummary(marketValuation);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Satış Fiyatı
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-x-2 gap-y-1 sm:mb-4">
        <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {formatPrice(listingPrice)}
        </span>
        <span className="pb-1 text-base font-medium text-muted-foreground/60 sm:text-xl">TL</span>
      </div>

      <MarketValuationBadge
        status={marketValuation.status}
        diff={marketValuation.diff}
        className="mb-3"
      />

      {!isOwner ? (
        <>
          <div
            className={cn(
              "mb-4 rounded-2xl border p-4",
              priceComparisonSummary.tone === "avantajli"
                ? "border-emerald-200 bg-emerald-50/70"
                : priceComparisonSummary.tone === "yuksek"
                  ? "border-amber-200 bg-amber-50/80"
                  : priceComparisonSummary.tone === "dengeli"
                    ? "border-sky-200 bg-sky-50/70"
                    : "border-border bg-muted/30"
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                  priceComparisonSummary.tone === "avantajli"
                    ? "bg-emerald-100 text-emerald-800"
                    : priceComparisonSummary.tone === "yuksek"
                      ? "bg-amber-100 text-amber-800"
                      : priceComparisonSummary.tone === "dengeli"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-background text-muted-foreground"
                )}
              >
                {priceComparisonSummary.eyebrow}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {priceComparisonSummary.meta}
              </span>
            </div>

            <p className="text-sm font-semibold text-foreground">{priceComparisonSummary.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {priceComparisonSummary.description}
            </p>

            <div className="mt-3 text-xs leading-5 text-muted-foreground">
              Daha fazla bağlam için{" "}
              <Link
                href="#fiyat"
                className="font-semibold text-foreground underline underline-offset-4"
              >
                aşağıdaki fiyat analizine
              </Link>{" "}
              ve sayfanın altındaki benzer ilanlara göz atabilirsin.
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-background to-background p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  <ShieldCheck className="size-3.5" />
                  Karar Özeti
                </div>
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  {trustDecision.title}
                </h2>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {trustDecision.ratioLabel}
              </span>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">{trustDecision.description}</p>

            {trustDecision.highlights.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {trustDecision.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-800"
                  >
                    <BadgeCheck className="size-3.5" />
                    {highlight}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mb-4 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs font-medium leading-5 text-muted-foreground lg:hidden">
            Aynı karar akışı aşağıdaki sabit çubukta da korunur. WhatsApp birincil, diğer iletişim
            seçenekleri ikincil kalır.
          </div>

          <div className="hidden lg:block">
            <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
              <ContactActions
                listingId={listingId}
                listingSlug={listingSlug}
                sellerId={sellerId}
                seller={seller}
                listingTitle={listingTitle}
                listingPrice={listingPrice}
                currentUserId={currentUserId}
                reportHref="#ilan-bildir"
              />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm font-medium text-muted-foreground">
          Bu sizin ilanınız
        </div>
      )}

      {!isOwner && (
        <div className="mt-4 hidden lg:block">
          <div className="mb-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
            <span className="font-semibold text-foreground">İstersen daha sonra:</span> teklif
            bırakabilir veya rezervasyon akışına geçebilirsin. İlk temas için önerilen yol
            WhatsApp&apos;tır.
          </div>
          <ReserveButton listingId={listingId} />
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <MessageCircle className="size-3.5" />
            Öncelikli temas: WhatsApp. İkincil aksiyonlar karar sonrası kullanım içindir.
          </div>
        </div>
      )}
    </div>
  );
}
