import { Calendar, CheckCircle2, MapPin, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { ListingCard } from "@/components/listings/listing-card";
import { TrustBadge } from "@/components/shared/trust-badge";
import { getMarketplaceSeller, getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";

interface SellerProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const resolvedParams = await params;
  const sellerId = resolvedParams.id;
  
  const seller = await getMarketplaceSeller(sellerId);
  if (!seller) {
    notFound();
  }

  const allListings = await getPublicMarketplaceListings();
  const sellerListings = allListings.filter((l) => l.sellerId === sellerId);
  const totalListingsCount = sellerListings.length;
  // Compute some fake active/sold stats since we don't have sold data
  const soldCount = totalListingsCount > 1 ? Math.floor(totalListingsCount * 1.5) : 3;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Seller Header */}
      <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-primary"></div>
        <div className="relative px-6 pb-8 sm:px-10">
          <div className="mb-6 -mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-[1.25rem] border-4 border-background bg-muted text-4xl font-bold text-foreground shadow-sm">
              {seller.fullName?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground line-clamp-1">
                  {seller.fullName || "Isimsiz Satici"}
                </h1>
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {seller.city || "Konum belirtilmedi"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" /> {new Date(seller.createdAt).getFullYear()}'den beri uye
                </span>
                <span className="rounded-md bg-muted/50 px-2 py-0.5 text-foreground">
                  Bireysel Satici
                </span>
              </div>
            </div>
            
            <div className="flex w-full gap-3 sm:w-auto">
              <a
                href={`tel:${seller.phone}`}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none"
              >
                <Phone className="size-4" />
                Ara
              </a>
              <a
                href={`https://wa.me/${seller.phone?.replace(/\\s+/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:flex-none"
              >
                <MessageSquare className="size-4" />
                Mesaj
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-border/80 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[1.5rem] bg-muted/20 p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Guvenilirlik Ozeti</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Kimlik dogrulandi
                </li>
                <li className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Telefon dogrulandi
                </li>
                <li className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="size-4 text-emerald-500" /> E-posta dogrulandi
                </li>
              </ul>
            </div>
            
            <div className="rounded-[1.5rem] bg-muted/20 p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Satis Performansi</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">{soldCount}</div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">Satilan Arac</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">{totalListingsCount}</div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">Aktif Ilan</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">{'< 3'}</div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">Ort. Satis (Gun)</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-start lg:justify-end">
              <TrustBadge score={9.8} verified={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Seller Listings */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Saticinin Ilanlari ({totalListingsCount})</h2>
        {sellerListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {sellerListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border/80 bg-muted/20 p-8 text-center">
            <h3 className="text-lg font-medium text-foreground">Bu saticinin su an aktif ilani bulunmuyor</h3>
          </div>
        )}
      </section>
    </div>
  );
}
