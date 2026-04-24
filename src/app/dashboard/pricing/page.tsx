import { Zap } from "lucide-react";
import type { Metadata } from "next";

import { DopingStore } from "@/components/dashboard/doping-store";
import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import type { Listing } from "@/types";

export const metadata: Metadata = {
  title: "Paketler & Doping | Oto Burada",
  description: "İlanlarınızı öne çıkarmak için doping paketleri satın alın.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await requireUser();

  const { listings } = await getStoredUserListings(user.id);
  const approvedListings = (listings as Listing[]).filter((l) => l.status === "approved");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
            <Zap size={20} className="text-amber-500 fill-amber-500/30" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Paketler</h2>
            <p className="text-sm text-muted-foreground font-medium">
              İlanlarını öne çıkarmak için doping satın al.
            </p>
          </div>
        </div>
      </div>

      {/* İlan seçimi */}
      {approvedListings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <Zap size={40} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-bold text-foreground mb-2">Yayındaki ilan bulunamadı</h3>
          <p className="text-sm text-muted-foreground">
            Doping satın alabilmek için en az bir onaylı ilanın olması gerekiyor.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {approvedListings.map((listing) => (
            <section key={listing.id} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                    İLAN
                  </p>
                  <h3 className="text-xl font-bold text-foreground truncate">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {listing.brand} {listing.model} · {listing.year} ·{" "}
                    {listing.price.toLocaleString("tr-TR")} ₺
                  </p>
                </div>
              </div>
              <DopingStore listingId={listing.id} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
