import type { Metadata } from "next";
import { Zap, Trophy, BadgeCheck, CarFront, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { HomeHero } from "@/components/layout/home-hero";
import { CarCard } from "@/components/modules/listings/car-card";
import { getAppUrl } from "@/lib/seo";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { WebSiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { cn } from "@/lib/utils";

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

        {/* Premium Discovery */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Premium Keşif</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">HAYALİNİZDEKİ ARACA GİDEN EN KISA YOL</p>
            </div>
            <Link href="/listings" className="group flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest transition-all hover:gap-3">
              Tümünü İncele <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                   <CarFront size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Markalar</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/satilik/${brand.slug}`}
                    className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1.5 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 size-24 bg-slate-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="size-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-300">
                        <CarFront size={20} strokeWidth={2.5} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{brand.brand}</h4>
                      <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {brand.models.length} MODEL &middot; {brand.models.reduce((sum, model) => sum + model.trims.length, 0)} PAKET
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                   <Trophy size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Şehirler</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {featuredCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/satilik-araba/${city.slug}`}
                    className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1.5 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 size-24 bg-slate-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="size-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-200 transition-all duration-300">
                        <BadgeCheck size={20} strokeWidth={2.5} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors">{city.city}</h4>
                      <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {city.districts.length} ÜSTÜN İLÇE
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <section className="bg-muted/30 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">Öne Çıkan İlanlar</h2>
                </div>
                <Link href="/listings?featured=true" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center">
                  Tümünü Gör <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredListings.map((listing, index) => (
                  <CarCard key={listing.id} listing={listing} priority={index < 2} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Listings */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-foreground">Yeni İlanlar</h2>
            <Link href="/listings" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center transition">
              Tümünü Gör <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestListings.map((listing) => (
                <CarCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border mt-6 rounded-2xl p-12 text-center shadow-sm">
              <CarFront size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-card-foreground mb-2">Henüz ilan bulunmuyor</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                İlk ilanı sen vererek platformda yerini alabilirsin. Türkiye&apos;nin en güvenilir pazarına hemen katıl!
              </p>
              <Link href="/dashboard/listings/create" className="mt-6 inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition">
                Hemen İlan Ver
              </Link>
            </div>
          )}
          <div className="mt-12 flex justify-center">
            <Link href="/listings" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
              Tüm İlanları Keşfet
            </Link>
          </div>
        </section>

        {/* Elite Trust & Performance */}
        <section className="bg-slate-900 py-32 relative overflow-hidden">
          {/* Abstract Background Accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -ml-64 -mb-64" />

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">Güvenli Ticaretin Standartı</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm font-bold uppercase tracking-[0.2em] opacity-80">
                TÜM İLANLARIMIZ KİMLİK ONAYLI VE ŞEFFAF EKSPERTİZ DESTEĞİYLE SUNULUR.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: <ShieldCheck size={40} strokeWidth={1} />, title: "Kurumsal Onay", desc: "Tüm satıcı profilleri moderasyon ekibimiz tarafından titizlikle incelenir ve kimlikleri doğrulanır.", color: "blue" },
                { icon: <CheckCircle2 size={40} strokeWidth={1} />, title: "Dijital Ekspertiz", desc: "Aracın tüm geçmişi ve teknik durumu bağımsız dijital raporlarla %100 şeffaflıkla sunulur.", color: "emerald" },
                { icon: <Zap size={40} strokeWidth={1} />, title: "AI Değerleme", desc: "Yapay zeka altyapımız ile aracınızın gerçek piyasa değerini anlık verilerle saniyeler içinde öğrenin.", color: "indigo" },
              ].map((item, i) => (
                <div key={i} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-[3rem] transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:-translate-y-2">
                  <div className={cn(
                    "size-20 rounded-[2rem] flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl",
                    item.color === "blue" ? "bg-blue-600 text-white shadow-blue-500/20" :
                    item.color === "emerald" ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                    "bg-indigo-600 text-white shadow-indigo-500/20"
                  )}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.desc}</p>
                  
                  {/* Premium Corner Accent */}
                  <div className="absolute top-8 right-8 text-white/5 font-black text-6xl select-none group-hover:text-white/10 transition-colors">
                    0{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Description & Growth Section */}
        <section className="bg-slate-50 py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
                  Türkiye&apos;nin En Güvenilir İkinci El Araç Platformu
                </h1>
                <div className="prose prose-slate max-w-none text-slate-600 font-medium">
                  <p className="text-lg leading-relaxed mb-6">
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
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Popüler Markalar</h3>
                    <ul className="space-y-2 text-sm">
                      {references.brands.slice(0, 8).map(b => (
                        <li key={b.slug}>
                          <Link href={`/satilik/${b.slug}`} className="text-slate-500 hover:text-blue-600 transition-colors">
                            {b.brand} İlanları
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Popüler Şehirler</h3>
                    <ul className="space-y-2 text-sm">
                      {references.cities.slice(0, 8).map(c => (
                        <li key={c.slug}>
                          <Link href={`/satilik-araba/${c.slug}`} className="text-slate-500 hover:text-orange-600 transition-colors font-semibold">
                            {c.city} Araç İlanları
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Neden OtoBurada?</h2>
                <ul className="space-y-6">
                  {[
                    "Ücretsiz ilan verme ve hızlı satış imkanı",
                    "Doğrulanmış ilanlar ve güvenilir satıcı profilleri",
                    "Gelişmiş filtreleme ile doğru araca 3 adımda ulaşım",
                    "WhatsApp üzerinden doğrudan satıcı iletişimi",
                    "Mobil uyumlu, hızlı ve sade kullanıcı deneyimi"
                  ].map((benefit, index) => (
                    <li key={index} className="flex gap-4 items-start">
                      <div className="size-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 size={14} strokeWidth={3} />
                      </div>
                      <span className="text-slate-600 font-bold text-sm tracking-tight">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 pt-10 border-t border-slate-100 italic text-slate-400 text-xs font-medium">
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
