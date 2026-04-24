import { Calendar, MapPin, Phone, Star, User, Verified } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGalleryBySlug, getGalleryListings } from "@/services/gallery/gallery-service";

interface GalleryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: GalleryPageProps) {
  const resolvedParams = await params;
  const gallery = await getGalleryBySlug(resolvedParams.slug);

  if (!gallery) {
    return { title: "Galeri Bulunamadı — OtoBurada" };
  }

  return {
    title: `${gallery.businessName || gallery.fullName} — OtoBurada`,
    description:
      gallery.businessDescription ??
      `${gallery.businessName || gallery.fullName} galerisinden satılık araçlar.`,
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const resolvedParams = await params;
  const gallery = await getGalleryBySlug(resolvedParams.slug);

  if (!gallery) {
    notFound();
  }

  const listings = await getGalleryListings(gallery.id, { limit: 24 });
  const memberSince = new Date(gallery.createdAt).getFullYear();

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
      {/* Gallery Header */}
      <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* Cover Image */}
        {gallery.businessCoverUrl && (
          <div className="relative h-48 sm:h-64 w-full">
            <Image
              src={gallery.businessCoverUrl}
              alt={gallery.businessName ?? "Galeri"}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Avatar & Info */}
            <div className="flex gap-4">
              <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border-4 border-background bg-muted">
                {gallery.businessLogoUrl ? (
                  <Image
                    src={gallery.businessLogoUrl}
                    alt={gallery.businessName ?? "Logo"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Star className="size-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{gallery.businessName || gallery.fullName}</h1>
                  {gallery.verifiedBusiness && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      <Verified className="h-3 w-3" />
                      Doğrulanmış
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {gallery.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {gallery.city}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {memberSince}&apos;den beri üye
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {gallery.totalListingsCount} ilan
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {gallery.phone && (
                <a
                  href={`tel:${gallery.phone}`}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold"
                >
                  <Phone className="h-4 w-4" />
                  Ara
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {gallery.businessDescription && (
            <p className="mt-4 text-sm text-muted-foreground">{gallery.businessDescription}</p>
          )}
        </div>
      </section>

      {/* Listings */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Satılık Araçlar ({listings.length})</h2>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            Henüz ilan yok.
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="flex items-center gap-4 rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="relative h-16 w-24 rounded-lg bg-muted shrink-0 overflow-hidden">
                  {listing.coverImage && (
                    <Image
                      src={listing.coverImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {listing.year} {listing.brand} {listing.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city} • {listing.price.toLocaleString("tr-TR")} TL
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
