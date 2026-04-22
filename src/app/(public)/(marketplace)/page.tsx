import type { Metadata } from "next";
import { Zap, CarFront, ChevronRight, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";

import { HomeHero } from "@/components/layout/home-hero";
import { ListingCard } from "@/components/shared/listing-card";
import { getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { WebSiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";


export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "İkinci El Araba İlanları | OtoBurada - Güvenli Araç Pazaryeri",
    description: "Türkiye genelinde ikinci el araba ilanları. Uygun fiyatlı araçları keşfet, kolayca satın al veya ücretsiz ilan vererek hemen sat. En güvenilir otomobil pazarı.",
    alternates: {
      canonical: getAppUrl(),
    },
    openGraph: {
      title: "İkinci El Araba İlanları | OtoBurada",
      description: "Türkiye genelinde binlerce ikinci el araba ilanı. Güvenle satın al, kolayca sat.",
      type: "website",
      url: getAppUrl(),
      siteName: "OtoBurada",
    },
  };
}

export default async function HomePage() {
  const [listingsResult, references] = await Promise.all([
    getPublicMarketplaceListings({ limit: 12, sort: "newest" }),
    getLiveMarketplaceReferenceData(),
  ]);

  const appUrl = getAppUrl();
  const featuredListings = listingsResult.listings.filter(l => l.featured).slice(0, 4);
  const latestListings = listingsResult.listings.slice(0, 8);
  const featuredBrands = references.brands.slice(0, 6);
  const featuredCities = references.cities.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <WebSiteStructuredData url={appUrl} />
      <OrganizationStructuredData 
        name="OtoBurada"
        url={appUrl}
        description="Türkiye'nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarı. Aradığın araba burada."
      />

      <main className="flex-1 w-full">
        {/* Modern Hero */}
        <HomeHero cities={references.cities.map((city) => city.city)} />

        {/* Quick Discovery */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-16">
          <div className="flex flex-col md:flex-row justify-between items-baseline gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Hızlı Keşfet</h2>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">ARADIĞIN ARACA GİDEN EN KISA YOL</p>
            </div>
            <Link href="/listings" prefetch={false} className="group flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-all">
              Tümünü İncele <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Markalar</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/satilik/${brand.slug}`}
                    prefetch={false}
                    className="group bg-card border border-border rounded-xl p-4 transition-all hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <CarFront size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{brand.brand}</h4>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                          {brand.models.length} Model
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Şehirler</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featuredCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/satilik-araba/${city.slug}`}
                    prefetch={false}
                    className="group bg-card border border-border rounded-xl p-4 transition-all hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{city.city}</h4>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                          {city.districts.length} İlçe
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="bg-muted/30 py-6 sm:py-8 md:py-10 lg:py-16">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">Öne Çıkan İlanlar</h2>
                </div>
                <Link href="/listings?featured=true" prefetch={false} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center">
                  Tümünü Gör <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredListings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} priority={index < 2} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Listings */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-foreground">Yeni İlanlar</h2>
            <Link href="/listings" prefetch={false} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center transition">
              Tümünü Gör <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border mt-6 rounded-2xl p-12 text-center shadow-sm">
              <CarFront size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Henüz ilan bulunmuyor</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                İlk ilanı sen vererek platformda yerini alabilirsin. Türkiye&apos;nin en güvenilir pazarına hemen katıl!
              </p>
              <Link href="/dashboard/listings/create" prefetch={false} className="mt-6 inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition">
                Hemen İlan Ver
              </Link>
            </div>
          )}
          <div className="mt-12 flex justify-center">
            <Link href="/listings" prefetch={false} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-sm shadow-primary/20">
              Tüm İlanları Keşfet
            </Link>
          </div>
        </section>

        {/* Trust & Performance - Calm UI */}
        <section className="bg-muted py-24 relative overflow-hidden border-y border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Güvenilir Araç Pazarı</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                TÜM İLANLARIMIZ MODERASYONDAN GEÇER VE ŞEFFAF FİYATLANDIRMA İLE SUNULUR.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <ShieldCheck size={28} strokeWidth={2} />, title: "Moderasyon", desc: "Tüm ilanlar inceleme sürecinden geçer. Şüpheli içerikler engellenir.", color: "muted" },
                { icon: <CheckCircle2 size={28} strokeWidth={2} />, title: "Ekspertiz Desteği", desc: "Araç geçmişi ve teknik durum şeffaf şekilde paylaşılır.", color: "muted" },
                { icon: <Zap size={28} strokeWidth={2} />, title: "Hızlı İletişim", desc: "Satıcılarla doğrudan WhatsApp üzerinden iletişim kurun.", color: "muted" },
              ].map((item, i) => (
                <div key={i} className="group relative bg-card border border-border p-8 rounded-2xl transition-all duration-300">
                   <div className="size-14 rounded-xl flex items-center justify-center mb-6 bg-muted text-muted-foreground border border-border/50">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Description & Growth Section */}
        <section className="bg-background py-24 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-3xl font-bold text-foreground tracking-tight mb-8">
                  Türkiye&apos;nin En Güvenilir İkinci El Araç Platformu
                </h2>
                <div className="prose-sm text-muted-foreground font-medium">
                  <p className="text-lg leading-relaxed mb-6 italic text-foreground">
                    OtoBurada ile ikinci el araba alım satım işlemlerinizi hızlı ve güvenli şekilde gerçekleştirin. 
                    Türkiye genelinde binlerce güncel ilanı keşfedin, hayalinizdeki araca en uygun fiyatlarla ulaşın.
                  </p>
                  <p className="mb-6">
                    Platformumuzda yer alan her ilan, kullanıcılarımıza özel geliştirilmiş AI destekli moderasyon ve 
                    şeffaf ekspertiz süreçlerinden geçer. İster aracınızı hemen satmak isteyin, ister yeni bir araç arayışında olun, 
                    OtoBurada her adımda yanınızda.
                  </p>
                </div>
                
                <div className="mt-12 grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Popüler Markalar</h3>
                    <ul className="space-y-2 text-sm">
                      {references.brands.slice(0, 8).map(b => (
                        <li key={b.slug}>
                          <Link href={`/satilik/${b.slug}`} prefetch={false} className="text-muted-foreground hover:text-primary transition-colors">
                            {b.brand} İlanları
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Popüler Şehirler</h3>
                    <ul className="space-y-2 text-sm">
                      {references.cities.slice(0, 8).map(c => (
                        <li key={c.slug}>
                          <Link href={`/satilik-araba/${c.slug}`} prefetch={false} className="text-muted-foreground hover:text-primary transition-colors font-semibold">
                            {c.city} Araç İlanları
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-card p-12 rounded-2xl border border-border shadow-sm">
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-6">Neden OtoBurada?</h2>
                <ul className="space-y-6">
                  {[
                    "Ücretsiz ilan verme ve hızlı satış imkanı",
                    "Moderasyondan geçen ilanlar ve güvenilir satıcı profilleri",
                    "Gelişmiş filtreleme ile doğru araca 3 adımda ulaşım",
                    "WhatsApp üzerinden doğrudan satıcı iletişimi",
                    "Mobil uyumlu, hızlı ve sade kullanıcı deneyimi"
                  ].map((benefit, index) => (
                    <li key={index} className="flex gap-4 items-start">
                      <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 size={14} strokeWidth={3} />
                      </div>
                      <span className="text-foreground/80 font-bold text-sm tracking-tight">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 pt-10 border-t border-border italic text-muted-foreground/50 text-xs font-medium uppercase tracking-[0.1em]">
                  * OtoBurada bir topluluk girişimidir ve kullanıcıların güvenli ticaret yapmalarını hedefler.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
