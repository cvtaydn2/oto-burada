import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CarFront,
  CircleGauge,
  Fuel,
  MapPin,
  MessageCircle,
  Phone,
  Settings2,
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { ReportListingForm } from "@/components/forms/report-listing-form";
import { ListingCard } from "@/components/listings/listing-card";
import { SectionHeader } from "@/components/shared/section-header";
import { exampleListings } from "@/data";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getListingBySlug, getListingSeller, getSimilarListings } from "@/services/listings/listing-details";

interface ListingDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const whatsappTemplate = "Merhaba, ilanınızla ilgileniyorum.";

export async function generateStaticParams() {
  return exampleListings.map((listing) => ({
    slug: listing.slug,
  }));
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const seller = getListingSeller(listing.sellerId);
  const similarListings = getSimilarListings(listing.slug, listing.brand, listing.city);
  const currentUser = await getCurrentUser();
  const whatsappLink = `https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappTemplate)}`;
  const specs = [
    {
      label: "Model Yılı",
      value: String(listing.year),
      icon: CalendarDays,
    },
    {
      label: "Kilometre",
      value: `${formatNumber(listing.mileage)} km`,
      icon: CircleGauge,
    },
    {
      label: "Yakıt Tipi",
      value: listing.fuelType,
      icon: Fuel,
    },
    {
      label: "Vites",
      value: listing.transmission,
      icon: Settings2,
    },
    {
      label: "Konum",
      value: `${listing.city} / ${listing.district}`,
      icon: MapPin,
    },
    {
      label: "Marka / Model",
      value: `${listing.brand} / ${listing.model}`,
      icon: CarFront,
    },
  ];

  return (
    <main className="bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/listings" className="transition-colors hover:text-foreground">
            İlanlar
          </Link>
          <span>/</span>
          <span className="text-foreground">{listing.brand}</span>
        </nav>

        <article className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-sm">
              <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_190px] sm:p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-muted">
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    priority
                    sizes="(min-width: 1280px) 70vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
                  {listing.images.slice(1).map((image) => (
                    <div
                      key={image.id ?? image.url}
                      className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-muted"
                    >
                      <Image
                        src={image.url}
                        alt={`${listing.title} görsel ${image.order + 1}`}
                        fill
                        sizes="(min-width: 640px) 190px, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                    {listing.featured ? "Öne Çıkan İlan" : "Yayında"}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    {formatDate(listing.createdAt)} tarihinde eklendi
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                    {formatCurrency(listing.price)}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {listing.title}
                  </h1>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {listing.city} / {listing.district}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <FavoriteButton
                    listingId={listing.id}
                    className="h-11 rounded-xl px-4"
                  />
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Favorileri yönet
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {specs.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Icon className="size-4 text-primary" />
                        {label}
                      </div>
                      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
              <SectionHeader
                title="Açıklama"
                description="Satıcının paylaştığı araç bilgileri ve kullanım özeti."
              />
              <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                <p>{listing.description}</p>
                <p>
                  İlan detayları kullanıcı tarafından girilmiştir. İlgini çekerse satıcı ile
                  doğrudan WhatsApp üzerinden iletişime geçip ek bilgi isteyebilirsin.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
              <SectionHeader
                title="Araç Bilgileri"
                description="Karar vermeni kolaylaştıracak temel bilgiler tek yerde."
              />
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {specs.map(({ label, value }) => (
                  <div key={label} className="rounded-[1.25rem] border border-border/70 p-4">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-2 text-base font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                    Satıcı Bilgileri
                  </p>
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                      {(seller?.fullName ?? "S").slice(0, 1)}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {seller?.fullName ?? "Doğrulanmış satıcı"}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BadgeCheck className="size-4 text-primary" />
                        Doğrulanmış satıcı
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {seller?.city ?? listing.city} konumunda araç ilanı veriyor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                  İlgini çeken araç için ilk iletişim kanalımız WhatsApp. Hızlıca soru sorabilir,
                  araç durumu ve ekspertiz bilgisini doğrudan öğrenebilirsin.
                </div>

                <div className="space-y-3">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp ile İletişime Geç
                  </a>
                  <a
                    href={`tel:${listing.whatsappPhone}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Phone className="size-4" />
                    Satıcıyı Ara
                  </a>
                  <ReportListingForm
                    listingId={listing.id}
                    sellerId={listing.sellerId}
                    userId={currentUser?.id ?? null}
                  />
                </div>
              </div>
            </section>
          </aside>
        </article>

        <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
          <SectionHeader
            title="Benzer ilanlar"
            description="Aynı markada veya aynı şehirde ilgini çekebilecek ilanları burada görebilirsin."
            actionHref="/listings"
            actionLabel="Tüm ilanları gör"
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {similarListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
