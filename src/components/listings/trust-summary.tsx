import { trust } from "@/lib/constants/ui-strings";
import { getSellerTrustUI } from "@/lib/listings/trust-ui";
import { cn } from "@/lib/utils";
import { type Profile } from "@/types";

export function TrustCard({
  title,
  value,
  description,
  styles,
}: {
  title: string;
  value: string;
  description: string;
  styles: { bg: string; text: string; border: string };
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-6 transition-all hover:shadow-sm",
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{title}</div>
      <div className="mt-2 text-xl font-bold tracking-tighter">{value}</div>
      <p className="mt-3 text-[11px] font-bold leading-relaxed opacity-60 uppercase tracking-wide">
        {description}
      </p>
    </div>
  );
}

interface TrustSummaryProps {
  listing: {
    expertInspection?: { hasInspection: boolean; inspectionDate?: string } | null;
    tramerAmount?: number | null;
    fraudScore?: number;
  };
  seller?: Partial<Profile> | null;
  updatedAt: string;
}

export function TrustSummary({ listing, seller, updatedAt }: TrustSummaryProps) {
  const lastUpdatedAt = new Date(updatedAt);
  const trustUI = getSellerTrustUI(seller);

  const trustItems = [
    {
      title: "Ekspertiz",
      value: listing.expertInspection?.hasInspection ? "Onaylı" : "Yok",
      description: listing.expertInspection?.inspectionDate
        ? "Resmi rapor mevcut"
        : "Ekspertiz beyan edilmedi",
      styles: listing.expertInspection?.hasInspection
        ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" }
        : { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
    },
    {
      title: "Tramer",
      value:
        listing.tramerAmount && listing.tramerAmount > 0
          ? `${new Intl.NumberFormat("tr-TR").format(listing.tramerAmount)} TL`
          : "SIFIR",
      description:
        listing.tramerAmount && listing.tramerAmount > 0
          ? "Hasar kaydı detayları"
          : "Hasar kaydı bulunmuyor",
      styles:
        listing.tramerAmount && listing.tramerAmount > 0
          ? { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" }
          : { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    },
    {
      title: "Satıcı",
      value: trustUI.label,
      description:
        trustUI.subMessage ||
        (trustUI.isPremiumVisible ? "Aktif ve doğrulanmış" : trust.unverified),
      styles: trustUI.styles,
    },
    {
      title: "Son Güncelleme",
      value: Number.isFinite(lastUpdatedAt.getTime())
        ? lastUpdatedAt.toLocaleDateString("tr-TR")
        : "-",
      description: `${lastUpdatedAt.toLocaleDateString("tr-TR")} güncellendi`,
      styles: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {trustItems.map((item) => (
        <TrustCard key={item.title} {...item} />
      ))}
    </div>
  );
}
