import { ArrowRight, Package, Plus, TrendingDown, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getGalleryListings, getGalleryStats } from "@/services/gallery/gallery-service";

export default async function StockDashboardPage() {
  const user = await requireUser();
  const stats = await getGalleryStats(user.id);
  const listings = await getGalleryListings(user.id, { limit: 12 });

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-4 py-6 sm:py-8 lg:px-10 lg:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Galeri stoğunuzu yönetin</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bulk-import">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Toplu Yükle
            </Button>
          </Link>
          <Link href="/dashboard/listings/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni İlan
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif İlan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arşivlenen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satılan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Aktif Stok ({listings.length})</h2>
          <Link
            href="/dashboard/listings"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Tümünü gör <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground mb-4">Henüz ilanınız yok.</p>
            <Link href="/dashboard/listings/create">
              <Button>İlk İlanınızı Verin</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/dashboard/listings/edit/${listing.id}`}
                className="flex items-center gap-4 rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="relative h-16 w-24 rounded-lg bg-muted shrink-0 overflow-hidden">
                  {listing.coverImage && (
                    <Image
                      src={listing.coverImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {listing.year} {listing.brand} {listing.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city} • {listing.price.toLocaleString("tr-TR")} TL
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
