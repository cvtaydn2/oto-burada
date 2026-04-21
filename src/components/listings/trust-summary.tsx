import { cn } from "@/lib/utils";

type TrustTone = "emerald" | "amber" | "blue" | "slate";

interface TrustCardProps {
  title: string;
  value: string;
  description: string;
  tone: TrustTone;
}

const toneClasses: Record<TrustTone, string> = {
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  slate: "border-slate-100 bg-slate-50 text-slate-700",
};

export function TrustCard({ title, value, description, tone }: TrustCardProps) {
  return (
    <div className={cn("rounded-3xl border p-6 transition-all hover:shadow-sm", toneClasses[tone])}>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{title}</div>
      <div className="mt-2 text-xl font-bold tracking-tighter">{value}</div>
      <p className="mt-3 text-[11px] font-bold leading-relaxed opacity-60 uppercase tracking-wide">{description}</p>
    </div>
  );
}

interface TrustSummaryProps {
  listing: {
    expertInspection?: { hasInspection: boolean; inspectionDate?: string } | null;
    tramerAmount?: number | null;
    fraudScore?: number;
  };
  seller?: Partial<{ isVerified: boolean; verifiedBusiness?: boolean }> | null;
  updatedAt: string;
}

export function TrustSummary({ listing, seller, updatedAt }: TrustSummaryProps) {
  const lastUpdatedAt = new Date(updatedAt);
  const sellerVerified = seller?.verifiedBusiness || seller?.isVerified;

  const trustItems = [
    {
      title: "Ekspertiz",
      value: listing.expertInspection?.hasInspection ? "Onaylı" : "Yok",
      description: listing.expertInspection?.inspectionDate ? "Resmi rapor mevcut" : "Ekspertiz beyan edilmedi",
      tone: listing.expertInspection?.hasInspection ? "emerald" as const : "amber" as const,
    },
    {
      title: "Tramer",
      value: listing.tramerAmount && listing.tramerAmount > 0 
        ? `${new Intl.NumberFormat("tr-TR").format(listing.tramerAmount)} TL` 
        : "SIFIR",
      description: listing.tramerAmount && listing.tramerAmount > 0 
        ? "Hasar kaydı detayları" 
        : "Hasar kaydı bulunmuyor",
      tone: listing.tramerAmount && listing.tramerAmount > 0 ? "amber" as const : "emerald" as const,
    },
    {
      title: "Satıcı",
      value: sellerVerified ? "DOĞRULANDI" : "DOĞRULANMADI",
      description: seller?.verifiedBusiness ? "İşletme bilgileri onaylı" : seller?.isVerified ? "Kimlik doğrulandı" : "Profil var, ek doğrulama görünmüyor",
      tone: sellerVerified ? "emerald" as const : "amber" as const,
    },
    {
      title: "Son Güncelleme",
      value: Number.isFinite(lastUpdatedAt.getTime()) ? lastUpdatedAt.toLocaleDateString("tr-TR") : "-",
      description: `${lastUpdatedAt.toLocaleDateString("tr-TR")} güncellendi`,
      tone: "blue" as const,
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
