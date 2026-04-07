import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Heart,
  User,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import {
  getStoredUserListings,
} from "@/services/listings/listing-submissions";

export default async function DashboardPage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    full_name?: string;
    phone?: string;
  };
  const storedListings = await getStoredUserListings(user.id);
  const pendingListingsCount = storedListings.filter((l) => l.status === "pending").length;
  const profileCompletion = Math.round(
    ([metadata.full_name, metadata.phone, metadata.city].filter(Boolean).length / 3) * 100,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border/80 bg-background p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {metadata.full_name ? `${metadata.full_name}, hoş geldin` : "Hoş geldin"}
            </h2>
            <p className="text-sm text-muted-foreground">
              İlanlarını ve favorilerini yönet
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/listings"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ClipboardList className="size-4" />
              İlanlarım
            </Link>
            <Link
              href="/dashboard/favorites"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              <Heart className="size-4" />
              Favoriler
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <ClipboardList className="size-4 text-indigo-500" />
            Toplam İlan
          </div>
          <p className="mt-2 text-2xl font-semibold">{storedListings.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {storedListings.filter((l) => l.status === "approved").length} yayında
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Clock className="size-4 text-amber-500" />
            Bekleyen
          </div>
          <p className="mt-2 text-2xl font-semibold">{pendingListingsCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Moderasyon sırası</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Heart className="size-4 text-rose-500" />
            Favoriler
          </div>
          <p className="mt-2 text-2xl font-semibold">-</p>
          <p className="mt-1 text-xs text-muted-foreground">Kaydedilen ilanlar</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <User className="size-4 text-slate-500" />
            Profil
          </div>
          <p className="mt-2 text-2xl font-semibold">{profileCompletion}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Tamamlandı</p>
        </div>
      </div>

      <section className="rounded-xl border border-border/80 bg-background p-4 sm:p-5">
        <h3 className="text-base font-semibold">Hızlı Erişim</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link
            href="/dashboard/listings"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted"
          >
            <span>İlan Ekle</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/dashboard/favorites"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted"
          >
            <span>Favoriler</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted"
          >
            <span>Profil</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </div>
  );
}
