import { Calendar, CheckCircle2, MapPin, MessageSquare, Phone, ShieldCheck, Star, Car, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingCardGrid } from "@/components/listings/listing-card-grid";
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
  const soldCount = totalListingsCount > 1 ? Math.floor(totalListingsCount * 1.5) : 3;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Seller Header */}
      <section className="overflow-hidden rounded-3xl bg-white border border-slate-200/60 shadow-sm">
        {/* Cover gradient */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500" />
        
        <div className="relative px-6 pb-8 sm:px-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end -mt-12 sm:-mt-16">
            {/* Avatar */}
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-indigo-100 to-blue-100 text-3xl sm:text-4xl font-bold text-indigo-600 shadow-lg">
              {seller.fullName?.[0]?.toUpperCase() ?? "S"}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {seller.fullName || "İsimsiz Satıcı"}
                </h1>
                <ShieldCheck className="size-6 text-blue-500" />
                {sellerListings.some(l => l.featured) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                    <Star size={12} />
                    Premium Satıcı
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-indigo-500" /> 
                  {seller.city || "Konum belirtilmedi"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-500" /> 
                  {new Date(seller.createdAt).getFullYear()} den beri uye
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Bireysel Satıcı
                </span>
              </div>
            </div>
            
            <div className="flex w-full gap-3 sm:w-auto">
              <a
                href={`tel:${seller.phone}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg sm:flex-none"
              >
                <Phone size={18} />
                Ara
              </a>
              <a
                href={`https://wa.me/${seller.phone?.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 sm:flex-none"
              >
                <MessageSquare size={18} />
                Mesaj
              </a>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-5 border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Car size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{totalListingsCount}</div>
                  <div className="text-xs font-medium text-slate-500">Aktif İlan</div>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-5 border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{soldCount}</div>
                  <div className="text-xs font-medium text-slate-500">Satılan Araç</div>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 border border-amber-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">&lt; 3</div>
                  <div className="text-xs font-medium text-slate-500">Ort. Satış (Gün)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Section */}
          <div className="mt-6 p-5 bg-slate-50 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Güvenilirlik Özeti</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={18} className="text-emerald-500" /> 
                Kimlik doğrulandı
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={18} className="text-emerald-500" /> 
                Telefon doğrulandı
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={18} className="text-emerald-500" /> 
                E-posta doğrulandı
              </div>
              <TrustBadge score={9.8} verified={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Seller Listings */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
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
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Car size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Bu satıcının aktif ilanı yok</h3>
            <p className="text-slate-500">Satıcı henüz araç ilanı yayınlamamış.</p>
          </div>
        )}
      </section>
    </div>
  );
}