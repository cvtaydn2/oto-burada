import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Heart,
  User,
  Zap,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getDatabaseFavoriteCount } from "@/services/favorites/favorite-records";
import {
  getStoredUserListings,
} from "@/services/listings/listing-submissions";
import { getStoredProfileById, buildProfileFromAuthUser } from "@/services/profile/profile-records";
import { ShieldCheck, ShieldAlert, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function DashboardPage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    full_name?: string;
    phone?: string;
  };
  const storedListings = await getStoredUserListings(user.id);
  const profile = (await getStoredProfileById(user.id)) ?? buildProfileFromAuthUser(user);
  const favoriteCount = await getDatabaseFavoriteCount(user.id);
  const pendingListingsCount = storedListings.filter((l) => l.status === "pending").length;
  const profileCompletion = Math.round(
    ([metadata.full_name, metadata.phone, metadata.city].filter(Boolean).length / 3) * 100,
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Verification Banner */}
      {!profile?.isVerified && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 border border-white/30">
              <ShieldAlert size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Hesabınızı Hemen Doğrulayın</h3>
              <p className="text-blue-50 text-sm mt-1 max-w-lg font-medium">
                E-Devlet ile hesabınızı doğrulayarak &quot;Onaylı Satıcı&quot; rozeti kazanın ve ilanlarınızın güvenilirliğini artırın.
              </p>
            </div>
          </div>
          <Link 
            href="/dashboard/profile"
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-blue-50 transition-colors shadow-sm relative z-10 whitespace-nowrap"
          >
            Hemen Doğrula
          </Link>
        </section>
      )}

      {profile?.isVerified && (
        <section className="bg-white border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800">Doğrulanmış Üye</span>
              <p className="text-[10px] text-slate-400 font-medium">Hesabınız E-Devlet üzerinden doğrulanmıştır.</p>
            </div>
          </div>
          <BadgeCheck className="text-blue-500" size={24} />
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam İlan", value: storedListings.length, icon: ClipboardList, color: "blue", sub: `${storedListings.filter(l => l.status === "approved").length} Yayında` },
          { label: "Bekleyen", value: pendingListingsCount, icon: Clock, color: "orange", sub: "Moderasyon Sırası" },
          { label: "Favoriler", value: favoriteCount, icon: Heart, color: "rose", sub: "Kaydedilen İlanlar" },
          { label: "Profil Doluluğu", value: `${profileCompletion}%`, icon: User, color: "indigo", sub: "Hesap Ayarları" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                stat.color === "blue" ? "bg-blue-50 text-blue-500" :
                stat.color === "orange" ? "bg-orange-50 text-orange-500" :
                stat.color === "rose" ? "bg-rose-50 text-rose-500" :
                "bg-indigo-50 text-indigo-500"
              )}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-[11px] text-slate-500 font-medium">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Son İlanlar</h3>
              <Link href="/dashboard/listings" className="text-sm font-bold text-blue-600 hover:text-blue-700">Tümünü Gör</Link>
            </div>
            
            <div className="space-y-4">
              {storedListings.slice(0, 3).map((listing) => (
                <Link 
                  key={listing.id} 
                  href={`/listing/${listing.slug}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <Image 
                      src={listing.images[0]?.url || "https://placehold.co/100x75?text=No+Image"} 
                      alt={listing.title}
                      width={100}
                      height={75}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {listing.title}
                    </h4>
                    <p className="text-[10px] font-bold text-blue-500 uppercase mt-0.5">
                      {listing.price.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide",
                      listing.status === "approved" ? "bg-green-50 text-green-600" :
                      listing.status === "pending" ? "bg-orange-50 text-orange-600" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {listing.status === "approved" ? "Yayında" : listing.status === "pending" ? "İnceleniyor" : listing.status}
                    </span>
                  </div>
                </Link>
              ))}
              {storedListings.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <ClipboardList size={32} />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Henüz ilanınız bulunmuyor.</p>
                  <Link 
                    href="/dashboard/listings" 
                    className="text-xs font-bold text-blue-600 mt-2 inline-block hover:underline"
                  >
                    Hemen İlan Ver
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <ArrowRight className="text-blue-500" size={20} />
              Hızlı Erişim
            </h3>
            <div className="grid gap-3">
              {[
                { label: "Yeni İlan Oluştur", href: "/dashboard/listings", icon: ClipboardList, color: "blue" },
                { label: "Favori İlanlarım", href: "/dashboard/favorites", icon: Heart, color: "rose" },
                { label: "Profil Bilgilerim", href: "/dashboard/profile", icon: User, color: "slate" },
                { label: "Toplu İlan Yükle", href: "/dashboard/bulk-import", icon: Zap, color: "orange" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
