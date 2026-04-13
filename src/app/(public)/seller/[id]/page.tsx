import { Calendar, CheckCircle2, MapPin, MessageSquare, Phone, Star, Car, Clock } from "lucide-react";
import { notFound } from "next/navigation";

import { ListingCardGrid } from "@/components/listings/listing-card-grid";
import { TrustBadge } from "@/components/shared/trust-badge";
import { getMarketplaceSeller, getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getSellerTrustSummary } from "@/services/profile/profile-trust";
import type { Listing } from "@/types";

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

  const listingsResult = await getPublicMarketplaceListings({ 
    sellerId, 
    limit: 100, // Fetch up to 100 listings for the profile
    page: 1,
    sort: "newest"
  });
  
  const sellerListings = listingsResult.listings;
  const totalListingsCount = listingsResult.total;
  const featuredListingCount = sellerListings.filter((listing: Listing) => listing.featured).length;
  const trustSummary = getSellerTrustSummary(seller, totalListingsCount);
  const memberSinceYear = new Date(seller.createdAt).getFullYear();

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
      {/* Seller Header */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Cover */}
        <div className="h-16 bg-slate-100 sm:h-20" />
        
        <div className="relative px-6 pb-8 sm:px-8">
          <div className="-mt-10 flex flex-col items-start gap-5 sm:-mt-12 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-4 border-white bg-slate-100 text-xl font-bold text-slate-500 shadow sm:h-16 sm:w-16 sm:text-2xl">
              {seller.fullName?.[0]?.toUpperCase() ?? "S"}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {seller.fullName || "İsimsiz Satıcı"}
                </h1>
                {sellerListings.some(l => l.featured) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Star size={10} />
                    Öne çıkan
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> 
                  {seller.city || "Konum belirtilmedi"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  {memberSinceYear} den beri üye
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Bireysel Satıcı
                </span>
              </div>
            </div>
            
            <div className="flex w-full gap-2 sm:w-auto">
              <a
                href={`tel:${seller.phone}`}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary/90 sm:flex-none"
              >
                <Phone size={16} />
                Ara
              </a>
              <a
                href={`https://wa.me/${seller.phone?.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition-all hover:bg-[#20bd5a] sm:flex-none"
              >
                <MessageSquare size={16} />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Car size={18} />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{totalListingsCount}</div>
                  <div className="text-xs text-slate-500 font-medium">Aktif ilan</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{featuredListingCount}</div>
                  <div className="text-xs text-slate-500 font-medium">Öne çıkan ilan</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{memberSinceYear}</div>
                  <div className="text-xs text-slate-500 font-medium">Üyelik yılı</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Section */}
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Güvenilirlik özeti</h3>
            <div className="flex flex-wrap gap-4">
              {trustSummary.signals.map((signal) => (
                <div key={signal} className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  {signal}
                </div>
              ))}
              <TrustBadge
                badgeLabel={trustSummary.badgeLabel}
                score={trustSummary.score}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Seller Listings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Satıcının İlanları ({totalListingsCount})
          </h2>
        </div>
        
        {sellerListings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellerListings.map((listing) => (
              <ListingCardGrid key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Car size={32} className="text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Bu satıcının aktif ilanı yok</h3>
            <p className="text-slate-500">Satıcı henüz araç ilanı yayınlamamış.</p>
          </div>
        )}
      </section>
    </div>
  );
}
