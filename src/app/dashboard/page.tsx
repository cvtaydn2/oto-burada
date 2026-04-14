import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Heart,
  Plus,
  User,
  Zap,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
} from "lucide-react";
import { DashboardFinancialSummary } from "@/components/dashboard/dashboard-financial-summary";
import { DashboardAppointments } from "@/components/dashboard/dashboard-appointments";

import { requireUser } from "@/lib/auth/session";
import { getDatabaseFavoriteCount } from "@/services/favorites/favorite-records";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { getStoredProfileById, buildProfileFromAuthUser } from "@/services/profile/profile-records";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
// revalidate kaldırıldı — force-dynamic ile çakışıyor

export default async function DashboardPage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    full_name?: string;
    phone?: string;
  };

  // Promise'leri hemen başlat, await etme — Suspense içinde resolve edilecek
  const listingsPromise = getStoredUserListings(user.id);
  const profilePromise = getStoredProfileById(user.id);
  const favoriteCountPromise = getDatabaseFavoriteCount(user.id);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Satıcı Paneli</h2>
            <p className="mt-1 text-sm text-slate-500">
              İlanlarını yönet, favori hareketlerini takip et ve hesabını canlıda güçlü tut.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/listings"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              İlan Yönetimi
            </Link>
            <Link
              href="/dashboard/listings"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600"
            >
              <Plus size={16} />
              Yeni İlan Ekle
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardDataSection
          favoriteCountPromise={favoriteCountPromise}
          listingsPromise={listingsPromise}
          metadata={metadata}
          profilePromise={profilePromise}
          user={user}
        />
      </Suspense>
    </div>
  );
}

async function DashboardDataSection({
  favoriteCountPromise,
  listingsPromise,
  metadata,
  profilePromise,
  user,
}: {
  favoriteCountPromise: Promise<number>;
  listingsPromise: Promise<Awaited<ReturnType<typeof getStoredUserListings>>>;
  metadata: {
    city?: string;
    full_name?: string;
    phone?: string;
  };
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
  const profileCompletion = Math.round(
    ([metadata.full_name, metadata.phone, metadata.city].filter(Boolean).length / 3) * 100,
  );

  return (
    <>
      {!profile?.isVerified ? (
        <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-200 md:flex-row">
          <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
              <ShieldAlert size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Hesabınızı Hemen Doğrulayın</h3>
              <p className="mt-1 max-w-lg text-sm font-medium text-blue-50">
                E-Devlet ile hesabınızı doğrulayarak &quot;Onaylı Satıcı&quot; rozeti kazanın ve ilanlarınızın güvenilirliğini artırın.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="relative z-10 whitespace-nowrap rounded-xl bg-white px-8 py-3 text-sm font-bold tracking-wide text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
          >
            Hemen Doğrula
          </Link>
        </section>
      ) : (
        <section className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800">Doğrulanmış Üye</span>
              <p className="text-[10px] font-medium text-slate-400">Hesabınız E-Devlet üzerinden doğrulanmıştır.</p>
            </div>
          </div>
          <BadgeCheck className="text-blue-500" size={24} />
        </section>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam İlan", value: storedListings.length, icon: ClipboardList, color: "blue", sub: `${approvedListingsCount} yayında` },
          { label: "Bekleyen", value: pendingListingsCount, icon: Clock, color: "orange", sub: "Moderasyon Sırası" },
          { label: "Favoriler", value: favoriteCount, icon: Heart, color: "rose", sub: "Kaydedilen İlanlar" },
          { label: "Profil Doluluğu", value: `${profileCompletion}%`, icon: User, color: "indigo", sub: "Hesap Ayarları" },
        ].map((stat) => (
          <div key={stat.label} className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-200">
            <div className="mb-4 flex items-start justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                stat.color === "blue" ? "bg-blue-50 text-blue-500" :
                stat.color === "orange" ? "bg-orange-50 text-orange-500" :
                stat.color === "rose" ? "bg-rose-50 text-rose-500" :
                "bg-indigo-50 text-indigo-500"
              )}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <div className="mb-1 text-3xl font-black text-slate-900">{stat.value}</div>
              <div className="text-[11px] font-medium text-slate-500">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Son İlanlar</h3>
              <Link href="/dashboard/listings" className="text-sm font-bold text-blue-600 hover:text-blue-700">Tümünü Gör</Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-medium">Araç Bilgisi</th>
                    <th className="pb-3 font-medium">Fiyat</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Şehir</th>
                    <th className="pb-3 text-right font-medium">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {storedListings.slice(0, 4).map((listing) => (
                    <tr key={listing.id} className="transition hover:bg-slate-50/80">
                      <td className="py-4">
                        <Link href={`/listing/${listing.slug}`} className="group flex items-center gap-3">
                          <div className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <Image
                              src={listing.images[0]?.url || "https://placehold.co/100x75?text=No+Image"}
                              alt={listing.title}
                              width={72}
                              height={48}
                              className="h-12 w-[72px] object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-800 group-hover:text-blue-600">
                              {listing.title}
                            </div>
                            <div className="mt-1 text-[11px] font-medium text-slate-500">
                              {listing.year} • {listing.brand} {listing.model}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 font-bold text-blue-500">
                        {listing.price.toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                          listing.status === "approved" ? "bg-green-50 text-green-600" :
                          listing.status === "pending" ? "bg-orange-50 text-orange-600" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {listing.status === "approved" ? "Yayında" : listing.status === "pending" ? "İnceleniyor" : listing.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-medium text-slate-500">
                        {listing.city}
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/dashboard/listings/${listing.id}/edit`}
                          className="text-xs font-bold text-slate-600 transition hover:text-blue-600"
                        >
                          Düzenle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {storedListings.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                    <ClipboardList size={32} />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Henüz ilanınız bulunmuyor.</p>
                  <Link
                    href="/dashboard/listings"
                    className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    Hemen İlan Ver
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <DashboardFinancialSummary
            successfulSalesAmount={1450000}
            pendingDepositsAmount={25000}
            successfulSalesCount={3}
            pendingDepositsCount={2}
          />

          <DashboardAppointments
            appointments={[
              {
                id: "1",
                date: new Date(2026, 5, 12),
                time: "14:30",
                customerName: "Ahmet Yılmaz",
                description: "BMW 320i",
                type: "expertise",
              },
              {
                id: "2",
                date: new Date(2026, 5, 15),
                time: "10:00",
                customerName: "Mehmet Can",
                description: "Passat",
                type: "showroom",
              },
            ]}
          />

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">            <h3 className="mb-2 text-lg font-black text-slate-900">Hesap Durumu</h3>
            <p className="mb-5 text-xs text-slate-500">
              Profil güveni ve ilan yayın akışın burada özetlenir.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Doğrulama</span>
                <span className={cn("text-xs font-bold", profile?.isVerified ? "text-emerald-600" : "text-amber-600")}>
                  {profile?.isVerified ? "Tamamlandı" : "Bekliyor"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Yayındaki ilanlar</span>
                <span className="text-sm font-black text-slate-900">{approvedListingsCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Favori kayıtları</span>
                <span className="text-sm font-black text-slate-900">{favoriteCount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-900">
              <ArrowRight className="text-blue-500" size={20} />
              Hızlı Erişim
            </h3>
            <div className="grid gap-3">
              {[
                { label: "Yeni İlan Oluştur", href: "/dashboard/listings", icon: ClipboardList },
                { label: "Favori İlanlarım", href: "/dashboard/favorites", icon: Heart },
                { label: "Profil Bilgilerim", href: "/dashboard/profile", icon: User },
                { label: "Toplu İlan Yükle", href: "/dashboard/bulk-import", icon: Zap },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-slate-400 transition-colors group-hover:text-blue-500" />
                    <span className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600">{item.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardContentSkeleton() {
  return (
    <>
      <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white lg:col-span-2" />
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </>
  );
}
