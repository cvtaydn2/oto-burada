import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Heart,
  User,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getDatabaseFavoriteCount } from "@/services/favorites/favorite-records";
import {
  getStoredUserListings,
} from "@/services/listings/listing-submissions";
import { getStoredProfileById, buildProfileFromAuthUser } from "@/services/profile/profile-records";
import { ShieldCheck, ShieldAlert, BadgeCheck } from "lucide-react";

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
    <div className="space-y-5">
      <section className="rounded-xl border border-border/80 bg-background p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">
              {metadata.full_name ? `${metadata.full_name}, hoş geldin` : "Hoş geldin"}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              İlanlarını ve favorilerini yönet
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/dashboard/listings"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <ClipboardList className="size-4" />
              İlanlarım
            </Link>
            <Link
              href="/dashboard/favorites"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              <Heart className="size-4" />
              Favoriler
            </Link>
          </div>
        </div>
      </section>

      {!profile?.isVerified && (
        <section className="flex flex-col items-center gap-5 rounded-xl border border-amber-200 bg-amber-50/60 p-6 md:flex-row">
          <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200 shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-amber-900">Hesabın henüz doğrulanmadı</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-800 font-medium">
              İlanlarının üst sıralarda görünmesi ve alıcıların sana daha fazla güvenmesi için E-Devlet (EİDS) ile hesabını hemen doğrula.
            </p>
          </div>
          <Link 
            href="/dashboard/profile"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 text-sm font-bold text-white transition-all hover:bg-amber-700 md:w-auto"
          >
            <ShieldCheck size={18} />
            Hemen Doğrula
          </Link>
        </section>
      )}

      {profile?.isVerified && (
        <section className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
          <BadgeCheck className="text-emerald-600" size={20} />
          <span className="text-xs font-bold text-emerald-800">Doğrulanmış Üye - Güvenli alışveriş başladı</span>
        </section>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-background p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <ClipboardList className="size-4 text-indigo-500" />
            Toplam İlan
          </div>
          <p className="mt-2 text-2xl font-black">{storedListings.length}</p>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            {storedListings.filter((l) => l.status === "approved").length} yayında
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Clock className="size-4 text-amber-500" />
            Bekleyen
          </div>
          <p className="mt-2 text-2xl font-black">{pendingListingsCount}</p>
          <p className="mt-1 text-xs text-muted-foreground font-medium">Moderasyon sırası</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Heart className="size-4 text-rose-500" />
            Favoriler
          </div>
          <p className="mt-2 text-2xl font-black">{favoriteCount}</p>
          <p className="mt-1 text-xs text-muted-foreground font-medium">Kaydedilen ilanlar</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <User className="size-4 text-slate-500" />
            Profil
          </div>
          <p className="mt-2 text-2xl font-black">{profileCompletion}%</p>
          <p className="mt-1 text-xs text-muted-foreground font-medium">Tamamlandı</p>
        </div>
      </div>

      <section className="rounded-xl border border-border/80 bg-background p-5 sm:p-6">
        <h3 className="text-base font-black">Hızlı Erişim</h3>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/listings"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted"
          >
            <span>İlan Ekle</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/dashboard/favorites"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted"
          >
            <span>Favoriler</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted"
          >
            <span>Profil</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/dashboard/bulk-import"
            className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-all group"
          >
            <span className="group-hover:translate-x-1 transition-transform">Toplu İlan Yükle</span>
            <ArrowRight className="size-4 text-primary group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
