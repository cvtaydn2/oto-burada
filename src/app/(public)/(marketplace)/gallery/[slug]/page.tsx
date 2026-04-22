import { Car, Eye } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { GalleryHeader } from "@/components/layout/gallery-header";
import { ListingCard } from "@/components/shared/listing-card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/utils/logger";
import { getGalleryBySlug, recordGalleryView } from "@/services/gallery";

interface GalleryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getGalleryBySlug(slug);
  if (!data) return { title: "Galeri Bulunamadı | OtoBurada" };

  const name = data.profile.businessName || data.profile.fullName;
  return {
    title: `${name} | OtoBurada Kurumsal Galeri`,
    description:
      data.profile.businessDescription || `${name} galerisinin tüm araç ilanlarını keşfedin.`,
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  const data = await getGalleryBySlug(slug);

  if (!data) {
    notFound();
  }

  const { profile, listings, viewCount30d, totalListings } = data;

  // Record gallery view (fire-and-forget)
  const headersList = await headers();
  const viewerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const currentUser = await getCurrentUser();
  recordGalleryView(profile.id, { viewerId: currentUser?.id, viewerIp }).catch((error) => {
    logger.market.error("Gallery view record failed", error, {
      galleryId: profile.id,
      gallerySlug: slug,
      viewerId: currentUser?.id,
    });
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <GalleryHeader profile={profile} />

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-white">
              <Car size={20} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Galerinin İlanları</h2>
          </div>
          <div className="flex items-center gap-3">
            {viewCount30d > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Eye size={13} />
                Son 30 günde {viewCount30d.toLocaleString("tr-TR")} ziyaret
              </div>
            )}
            <Badge
              variant="outline"
              className="border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {totalListings} araç
            </Badge>
          </div>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} priority={index < 4} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/30 text-slate-300">
              <Car size={40} />
            </div>
            <h3 className="text-xl font-semibold text-foreground/90">Henüz ilan mevcut değil</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Bu galeri henüz aktif bir araç ilanı eklememiş.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
