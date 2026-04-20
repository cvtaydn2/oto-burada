import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Eye,
  Heart,
  Plus,
  User,
  Zap,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  TrendingUp,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Star,
  Settings,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getDatabaseFavoriteCount } from "@/services/favorites/favorite-records";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { getStoredProfileById, buildProfileFromAuthUser } from "@/services/profile/profile-records";
import { cn } from "@/lib/utils";
import { DashboardContentSkeleton } from "@/components/dashboard/dashboard-content-skeleton";
import { dashboard } from "@/lib/constants/ui-strings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const listingsPromise = getStoredUserListings(user.id);
  const profilePromise = getStoredProfileById(user.id);
  const favoriteCountPromise = getDatabaseFavoriteCount(user.id);

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12">
        
        {/* Dashboard Header */}
        <section className="bg-background border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                <LayoutDashboard size={12} />
                {dashboard.controlCenter}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Hoş Geldin, <span className="text-primary">{user.email?.split("@")[0]}</span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                Profilini ve ilanlarını buradan yönetebilirsin.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/listings?create=true"
                className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
              >
                <Plus size={18} />
                {dashboard.newListing}
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex items-center gap-1 border-t border-border pt-6 overflow-x-auto no-scrollbar">
            {[
              { label: dashboard.summary, href: "/dashboard", icon: LayoutDashboard, active: true },
              { label: dashboard.myListings, href: "/dashboard/listings", icon: ClipboardList },
              { label: dashboard.messages, href: "/dashboard/messages", icon: MessageSquare },
              { label: dashboard.favorites, href: "/dashboard/favorites", icon: Star },
              { label: dashboard.settings, href: "/dashboard/profile", icon: Settings },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold whitespace-nowrap transition-all",
                  tab.active 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </Link>
            ))}
          </div>
        </section>

        <Suspense fallback={<DashboardContentSkeleton />}>
          <DashboardDataSection
            favoriteCountPromise={favoriteCountPromise}
            listingsPromise={listingsPromise}
            profilePromise={profilePromise}
            user={user}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardDataSection({
  favoriteCountPromise,
  listingsPromise,
  profilePromise,
  user,
}: {
  favoriteCountPromise: Promise<number>;
  listingsPromise: Promise<Awaited<ReturnType<typeof getStoredUserListings>>>;
  profilePromise: Promise<Awaited<ReturnType<typeof getStoredProfileById>>>;
  user: Awaited<ReturnType<typeof requireUser>>;
}) {
  const [storedListings, storedProfile, favoriteCount] = await Promise.all([
    listingsPromise,
    profilePromise,
    favoriteCountPromise,
  ]);
  const profile = storedProfile ?? buildProfileFromAuthUser(user);
  const pendingListingsCount = storedListings.filter((listing) => listing.status === "pending").length;
  const approvedListingsCount = storedListings.filter((listing) => listing.status === "approved").length;

  return (
    <div className="space-y-8">
      {/* Verification & Alerts */}
      {!profile?.emailVerified && (
        <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl bg-destructive/10 p-6 text-destructive border border-destructive/20 md:flex-row animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">E-posta Adresini Doğrula</h4>
              <p className="text-xs font-medium opacity-80 mt-0.5">İlan verebilmek ve tüm özellikleri kullanabilmek için e-posta doğrulamanız gerekiyor.</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="rounded-lg h-9 px-6 font-bold text-[10px] tracking-widest uppercase" asChild>
            <Link href="/dashboard/profile">DOĞRULA</Link>
          </Button>
        </section>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Aktif İlanlarım",
            value: approvedListingsCount,
            icon: ClipboardList,
            color: "text-blue-600",
          },
          {
            label: "Bekleyen Onay",
            value: pendingListingsCount,
            icon: Clock,
            color: "text-amber-600",
          },
          {
            label: "Favori Kaydı",
            value: favoriteCount,
            icon: Heart,
            color: "text-rose-600",
          },
          {
            label: "Sistem Kredisi",
            value: profile?.balanceCredits ?? 0,
            icon: Zap,
            color: "text-indigo-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:bg-muted/30">
            <div className="mb-4 flex items-center justify-between">
              <div className={cn("flex size-9 items-center justify-center rounded-lg bg-muted border border-border text-muted-foreground")}>
                <stat.icon size={18} />
              </div>
            </div>
            
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Storefront Management */}
      {profile?.userType === "professional" && profile.businessSlug && (
        <section className="overflow-hidden rounded-xl bg-card border border-border p-6 lg:p-8 shadow-sm relative group">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-primary border border-primary/10">
                <LayoutDashboard size={12} />
                Kurumsal Kontrol Paneli
              </div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {profile.businessName || "Mağazam"} <span className="text-primary font-medium">Yayında</span>
              </h2>
              <p className="text-xs font-medium text-muted-foreground max-w-lg">
                Showroom sayfanız şu anda yayında. Müşterileriniz tüm ilanlarınıza tek bir adresten ulaşabilir.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
               <div className="flex items-center h-12 w-full sm:w-auto rounded-lg bg-muted/50 border border-border px-4 transition-all hover:bg-muted">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest block leading-none mb-1">Mağaza URL</span>
                    <span className="text-xs font-semibold text-muted-foreground truncate block">otoburada.com/gallery/{profile.businessSlug}</span>
                  </div>
                  <Link 
                    href={`/gallery/${profile.businessSlug}`}
                    target="_blank"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm border border-border transition-all hover:bg-foreground hover:text-background"
                  >
                    <Eye size={14} />
                  </Link>
               </div>
               
               <Link
                href={`/gallery/${profile.businessSlug}`}
                target="_blank"
                className="flex h-12 w-full sm:w-auto items-center gap-2 rounded-xl bg-primary px-8 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-sm hover:opacity-90 transition-all"
               >
                 Mağazaya Git
                 <ChevronRight size={14} />
               </Link>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border">
             {[
               { label: "Durum", value: "Aktif", icon: Eye, sub: "İstatistikler yükleniyor" },
               { label: "Güven Durumu", value: profile.verifiedBusiness ? "Onaylı" : "İnceleniyor", icon: ShieldCheck, sub: profile.verifiedBusiness ? "Güven mührü aktif" : "Belge kontrolü yapılıyor" },
               { label: "Özellikler", value: "Kurumsal", icon: Zap, sub: "Sınırsız İlan & XML" }
             ].map(i => (
               <div key={i.label} className="flex gap-3">
                 <div className="size-9 rounded-lg bg-muted/40 border border-border flex items-center justify-center text-muted-foreground/60 shrink-0">
                    <i.icon size={16} />
                 </div>
                 <div>
                   <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-0.5">{i.label}</div>
                   <div className="text-sm font-bold text-foreground leading-tight">{i.value}</div>
                   <div className="text-[10px] font-medium text-muted-foreground/60">{i.sub}</div>
                 </div>
               </div>
             ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Recent Activity */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Son İlanlar</h3>
                <p className="text-xs font-medium text-muted-foreground">Aktif ilanlarının performansını buradan izle.</p>
              </div>
              <Link href="/dashboard/listings" className="flex items-center gap-1.5 rounded-lg bg-muted h-9 px-4 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/80">
                TÜMÜ
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    <th className="pb-3 text-left font-bold">ARAÇ</th>
                    <th className="pb-3 text-left font-bold">FİYAT</th>
                    <th className="pb-3 text-left font-bold">DURUM</th>
                    <th className="pb-3 text-right font-bold">AKSİYON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {storedListings.slice(0, 5).map((listing) => (
                    <tr key={listing.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <Link href={`/listing/${listing.slug}`} className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            <Image
                              src={listing.images[0]?.url || "https://placehold.co/100x75?text=Ara%C3%A7"}
                              alt={listing.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-foreground text-sm leading-tight transition-colors group-hover:text-primary">
                              {listing.title}
                            </div>
                            <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
                              {listing.year} &middot; {listing.brand}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-foreground text-sm">
                          {listing.price.toLocaleString("tr-TR")} ₺
                        </div>
                      </td>
                      <td className="py-3">
                        <div className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                          listing.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                          listing.status === "pending" ? "bg-amber-50 text-amber-600" :
                          "bg-muted text-muted-foreground/60"
                        )}>
                          {listing.status === "approved" ? "YAYINDA" :
                           listing.status === "pending" ? "ONAYDA" : "PASİF"}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mr-1">
                              <Eye size={12} />
                              {listing.viewCount ?? 0}
                           </div>
                          <Link
                            href={`/dashboard/listings?edit=${listing.id}`}
                            className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                          >
                            <Settings size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {storedListings.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground/30">
                    <ClipboardList size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">İlan bulunamadı</h4>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Henüz ilan yayınlamamışsınız.</p>
                  <Button className="mt-6 rounded-xl" asChild>
                    <Link href="/dashboard/listings?create=true">İlan Yayınla</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Contextual Tools */}
        <div className="space-y-8">
          {/* Credit Management Panel */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight mb-1 text-foreground">Doping Kredileri</h3>
            <p className="text-xs font-medium text-muted-foreground mb-6">İlanlarını öne çıkarmak için kredi kullan.</p>
            
            <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border p-5 mb-6">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MEVCUT BAKİYE</div>
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-primary" />
                  <span className="text-3xl font-bold tracking-tighter text-foreground">{profile?.balanceCredits ?? 0}</span>
                </div>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted border border-border">
                <Sparkles size={20} className="text-primary/40" />
              </div>
            </div>

            <Link
              href="/dashboard/pricing"
              className="flex h-11 items-center justify-center rounded-xl bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-sm hover:opacity-90 transition-all w-full"
            >
              KREDİ AL
            </Link>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">HIZLI ERİŞİM</span>
              <div className="h-px w-full bg-border" />
            </div>
            
            <div className="grid gap-2">
              {[
                { label: "İlan Yayınla", href: "/dashboard/listings?create=true", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Favorilerim", href: "/dashboard/favorites", icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
                { label: "Profil Ayarları", href: "/dashboard/profile", icon: User, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Mesajlar", href: "/dashboard/messages", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex size-9 items-center justify-center rounded-lg", item.bg)}>
                      <item.icon size={16} className={item.color} />
                    </div>
                    <span className="text-sm font-bold text-foreground tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground transition-all group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
