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
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12">
        
        {/* Elite Header section */}
        <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-8 py-10 text-white shadow-sm shadow-slate-900/20">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent opacity-50" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 backdrop-blur-md border border-white/10">
                <LayoutDashboard size={12} strokeWidth={3} />
                {dashboard.controlCenter}
              </div>
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Hoş Geldin, <span className="text-blue-400">{user.email?.split("@")[0]}</span>
              </h1>
              <p className="mt-3 max-w-xl text-lg font-bold text-slate-400">
                OtoBurada üzerindeki ticari faaliyetlerini buradan yönetebilir, performansını anlık olarak izleyebilirsin.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard/listings?create=true"
                className="flex h-16 items-center gap-3 rounded-2xl bg-blue-600 px-8 text-sm font-bold uppercase tracking-widest text-white shadow-sm shadow-blue-600/40 transition-all hover:bg-blue-700  "
              >
                <Plus size={20} strokeWidth={3} />
                {dashboard.newListing}
              </Link>
            </div>
          </div>

          {/* New Tabbed Nav - Cinema Style */}
          <div className="relative z-10 mt-12 flex items-center gap-2 border-t border-white/10 pt-8 overflow-x-auto no-scrollbar">
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
                  "flex h-12 items-center gap-3 rounded-xl px-6 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  tab.active 
                    ? "bg-white text-slate-900 shadow-sm shadow-white/10" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={16} strokeWidth={tab.active ? 3 : 2} />
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
    <div className="space-y-12">
      {/* Verification & Alerts */}
      {!profile?.emailVerified ? (
        <section className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-8 text-white shadow-sm shadow-rose-900/20 md:flex-row">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-inner">
              <ShieldAlert size={40} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Kısıtlı Erişim: E-posta Doğrulanmadı</h3>
              <p className="mt-2 max-w-xl text-lg font-bold text-rose-100">
                Pazaryerinde güvenliği sağlamak için ilan vermeden önce e-postanı doğrulaman gerekiyor. Bu işlem sadece 30 saniye sürer.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="group relative z-10 flex h-16 items-center gap-3 whitespace-nowrap rounded-2xl bg-white px-10 text-sm font-bold uppercase tracking-widest text-rose-600 shadow-sm transition-all  "
          >
            Hemen Doğrula
            <ArrowRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      ) : (
        <section className="flex items-center justify-between rounded-3xl border border-white bg-white p-6 shadow-sm shadow-slate-200/50 group hover:shadow-sm transition-all duration-500">
          <div className="flex items-center gap-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">Hesap Güvenliği Aktif</span>
                <BadgeCheck className="text-blue-500" size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Sınırsız ilan yayınlama ve işlem yetkisi tanımlandı.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DOĞRULANMIŞ ÜYE
          </div>
        </section>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Aktif İlanlarım",
            value: approvedListingsCount,
            icon: ClipboardList,
            color: "blue",
            sub: `${storedListings.length} toplam kayıt`,
            bg: "bg-blue-600",
          },
          {
            label: "Bekleyen Onay",
            value: pendingListingsCount,
            icon: Clock,
            color: "amber",
            sub: "Uzman incelemesinde",
            bg: "bg-amber-500",
          },
          {
            label: "Favori Kaydı",
            value: favoriteCount,
            icon: Heart,
            color: "rose",
            sub: "Kullanıcı etkileşimi",
            bg: "bg-rose-500",
          },
          {
            label: "Sistem Kredisi",
            value: profile?.balanceCredits ?? 0,
            icon: Zap,
            color: "indigo",
            sub: "Öne çıkarma bakiyen",
            bg: "bg-indigo-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white bg-white p-8 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-sm">
            <div className={cn("absolute -right-8 -top-8 size-32 rounded-full opacity-[0.03] transition-transform group-", stat.bg)} />
            
            <div className="mb-6 flex items-start justify-between">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 shadow-inner group-hover:bg-slate-100 transition-colors">
                <stat.icon size={24} strokeWidth={2.5} className={cn(
                  stat.color === "blue" ? "text-blue-600" :
                  stat.color === "amber" ? "text-amber-600" :
                  stat.color === "rose" ? "text-rose-600" :
                  "text-indigo-600"
                )} />
              </div>
              <div className="flex h-8 items-center gap-1.5 rounded-full bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <TrendingUp size={12} className="text-emerald-500" />
                Live
              </div>
            </div>
            
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-bold text-slate-900 tracking-tighter">{stat.value}</div>
                <div className="text-xs font-bold text-slate-300">ADET</div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className={cn("size-2 rounded-full", stat.bg)} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Storefront Management */}
      {profile?.userType === "professional" && profile.businessSlug && (
        <section className="relative overflow-hidden rounded-2xl bg-white border border-white p-10 shadow-sm shadow-slate-200/40 group">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-slate-50/50 -skew-x-12 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 border border-blue-100">
                <LayoutDashboard size={12} strokeWidth={3} />
                Kurumsal Mağaza Yönetimi
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {profile.businessName || "Mağazam"} <span className="text-blue-600">Aktif</span>
              </h2>
              <p className="text-sm font-bold text-slate-400 max-w-xl leading-relaxed">
                Showroom sayfanız şu anda yayında. İlanlarınızın kurumsal bir kimlikle sergilendiği mağaza URL&apos;nizi müşterilerinizle paylaşabilirsiniz.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
               <div className="group/url relative flex items-center h-16 w-full sm:w-[320px] rounded-2xl bg-slate-50 border border-slate-100 px-6 transition-all hover:border-blue-200 hover:bg-white overflow-hidden">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-0.5">Mağaza Linki</span>
                    <span className="text-sm font-bold text-slate-600 truncate block">otoburada.com/gallery/{profile.businessSlug}</span>
                  </div>
                  <Link 
                    href={`/gallery/${profile.businessSlug}`}
                    target="_blank"
                    className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm border border-slate-100 transition-all hover:bg-slate-900 hover:text-white"
                  >
                    <Eye size={18} strokeWidth={2.5} />
                  </Link>
               </div>
               
               <Link
                href={`/gallery/${profile.businessSlug}`}
                target="_blank"
                className="flex h-16 w-full sm:w-auto items-center gap-3 rounded-2xl bg-slate-900 px-10 text-xs font-bold uppercase tracking-widest text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/20 "
               >
                 Mağazayı Önizle
                 <ChevronRight size={16} strokeWidth={3} />
               </Link>
            </div>
          </div>
          
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-50">
             {[
               { label: "Mağaza Ziyareti", value: "Live", icon: Eye, sub: "İstatistikler yükleniyor..." },
               { label: "Doğrulama Durumu", value: profile.verifiedBusiness ? "Onaylı" : "Beklemede", icon: ShieldCheck, sub: profile.verifiedBusiness ? "Kurumsal güven mührü aktif" : "Belge kontrolü devam ediyor" },
               { label: "Toplu İşlemler", value: "Aktif", icon: Zap, sub: "XML / Excel entegrasyonu" }
             ].map(i => (
               <div key={i.label} className="flex gap-4">
                 <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <i.icon size={20} />
                 </div>
                 <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{i.label}</div>
                   <div className="text-sm font-bold text-slate-800">{i.value}</div>
                   <div className="text-[9px] font-bold text-slate-400 mt-0.5">{i.sub}</div>
                 </div>
               </div>
             ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Left: Recent Activity */}
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-white bg-white p-10 shadow-sm shadow-slate-200/40">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Son Yayınlananlar</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">Aktif ilanlarının performansını ve durumunu izle.</p>
              </div>
              <Link href="/dashboard/listings" className="flex items-center gap-2 rounded-xl bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-900 transition-colors hover:bg-slate-100">
                Tümünü Gör
                <ChevronRight size={14} strokeWidth={3} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    <th className="pb-6 text-left">Araç / İlan Bilgisi</th>
                    <th className="pb-6 text-left">Fiyat</th>
                    <th className="pb-6 text-left">Durum</th>
                    <th className="pb-6 text-right">Performans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {storedListings.slice(0, 5).map((listing) => (
                    <tr key={listing.id} className="group transition-all hover:bg-slate-50/50">
                      <td className="py-6">
                        <Link href={`/listing/${listing.slug}`} className="flex items-center gap-5">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                            <Image
                              src={listing.images[0]?.url || "https://placehold.co/100x75?text=No+Image"}
                              alt={listing.title}
                              fill
                              className="object-cover transition-transform duration-500 group-"
                            />
                            {listing.status === "approved" && (
                              <div className="absolute right-1 top-1 size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-900 text-base leading-none mb-2 group-hover:text-blue-600 transition-colors">
                              {listing.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              <span className="text-blue-500">{listing.year}</span>
                              <span className="size-1 rounded-full bg-slate-200" />
                              {listing.brand} {listing.model}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-6">
                        <div className="font-bold text-slate-900 text-lg tracking-tight">
                          {listing.price.toLocaleString("tr-TR")} <span className="text-xs text-slate-400">₺</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                          listing.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                          listing.status === "pending" ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-400"
                        )}>
                          {listing.status === "approved" ? "Yayında" :
                           listing.status === "pending" ? "Onay Bekliyor" : "Arşivlendi"}
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                              <Eye size={14} className="text-blue-500" />
                              {listing.viewCount ?? 0}
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">İzlenme</span>
                          </div>
                          <Link
                            href={`/dashboard/listings?edit=${listing.id}`}
                            className="flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-900 hover:text-white"
                          >
                            <Settings size={18} strokeWidth={2.5} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {storedListings.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                    <ClipboardList size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Henüz İlanın Yok</h4>
                  <p className="mt-2 text-sm font-bold text-slate-400">İlk ilanını vererek satışa başlayabilirsin.</p>
                  <Link
                    href="/dashboard/listings?create=true"
                    className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 text-xs font-bold uppercase tracking-widest text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700"
                  >
                    Hemen İlan Ver
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Contextual Tools */}
        <div className="space-y-12">
          {/* Credit Management Panel */}
          <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-8 text-white shadow-sm shadow-indigo-900/20">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
            <h3 className="relative z-10 text-xl font-bold tracking-tight mb-2">Pazaryeri Kredileri</h3>
            <p className="relative z-10 text-sm font-bold text-indigo-100 mb-8 opacity-80">İlanlarını öne çıkarmak için kullanabileceğin bakiyen.</p>
            
            <div className="relative z-10 flex items-center justify-between rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 mb-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">Bakiyen</div>
                <div className="flex items-center gap-2">
                  <Zap size={24} fill="currentColor" className="text-amber-400" />
                  <span className="text-4xl font-bold tracking-tighter">{profile?.balanceCredits ?? 0}</span>
                </div>
              </div>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <Sparkles size={24} className="text-amber-200" />
              </div>
            </div>

            <Link
              href="/dashboard/pricing"
              className="relative z-10 flex h-14 items-center justify-center rounded-2xl bg-white text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm transition-all   w-full"
            >
              Kredi Yükle
            </Link>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-6">
            <h4 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400">
              <div className="h-px flex-1 bg-slate-100" />
              Hızlı Erişim
              <div className="h-px flex-1 bg-slate-100" />
            </h4>
            
            <div className="grid gap-3">
              {[
                { label: "Toplu İlan Yükle", href: "/dashboard/bulk-import", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Favori İlanlarım", href: "/dashboard/favorites", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
                { label: "Profil Ayarları", href: "/dashboard/profile", icon: User, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Mesaj Kutusu", href: "/dashboard/messages", icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-50" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-white bg-white p-5 shadow-sm shadow-slate-200/30 transition-all hover:shadow-sm hover:-translate-x-1"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex size-10 items-center justify-center rounded-xl shadow-inner", item.bg)}>
                      <item.icon size={18} strokeWidth={2.5} className={item.color} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight size={16} strokeWidth={3} className="text-slate-200 transition-all group-hover:text-slate-900 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
