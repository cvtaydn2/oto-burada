import { Search, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "@/features/admin-moderation/components/inventory-table";
import { ListingsModeration } from "@/features/admin-moderation/components/listings-moderation";
import { SimplePagination } from "@/features/admin-moderation/components/simple-pagination";
import { getAdminInventory } from "@/features/admin-moderation/services/inventory";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin İlan Yönetimi | OtoBurada",
  description: "Moderasyon kuyruğunu, yayındaki ilanları ve arşiv geçmişini tek akışta yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/listings"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminListingsPageProps {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const adminUser = await requireAdminUser();
  const { q, page, status = "pending" } = await searchParams;
  const currentPage = Number(page) || 1;
  const normalizedStatus =
    status === "pending" || status === "approved" || status === "history" ? status : "approved";

  const [
    { total: pendingCount },
    { total: approvedCount },
    { total: historyCount },
    { listings, total, limit },
  ] = await Promise.all([
    getAdminInventory({ status: "pending", limit: 1 }),
    getAdminInventory({ status: "approved", limit: 1 }),
    getAdminInventory({ status: "history", limit: 1 }),
    getAdminInventory({ query: q, status: normalizedStatus, page: currentPage }),
  ]);

  const totalPages = Math.ceil(total / (limit || 12));

  return (
    <main className="min-h-full max-w-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Envanter Denetimi
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                İlan <span className="text-blue-600">Yönetimi</span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Moderasyon kuyruğunu, yayındaki ilanları ve arşiv geçmişini tek akışta yönet.
                Destructive işlemler ek onay penceresiyle korunur.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700/80">
                Bekleyen
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700/80">
                Yayında
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {approvedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Arşiv
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {historyCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Görünen sonuç
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{total}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/20 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Moderasyon ve yayın akışı
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Kuyrukta filtrele, ilanı ön izle ve yalnızca doğruladıktan sonra karar ver.
              </p>
            </div>

            <form className="relative w-full xl:max-w-xl group">
              <input type="hidden" name="status" value={status} />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-blue-500"
                size={18}
              />
              <Input
                name="q"
                defaultValue={q}
                className="h-11 rounded-2xl border-border bg-background pl-11 text-sm font-medium transition-all placeholder:text-muted-foreground/70 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                placeholder="VIN, başlık, marka veya ID ile ara"
              />
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <ShieldAlert className="size-4 shrink-0" />
            Kalıcı silme ve yayından kaldırma gibi kritik işlemler ek onay gerektirir.
          </div>
        </div>

        <Tabs value={normalizedStatus} className="w-full">
          <div className="border-b border-border/50 px-4 py-3 sm:px-6">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
              <TabsTrigger
                value="pending"
                asChild
                className="h-auto rounded-2xl border border-border/70 px-4 py-3 data-[state=active]:border-amber-300 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-none"
              >
                <Link
                  href={`?status=pending${q ? `&q=${q}` : ""}`}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-semibold">Onay bekleyenler</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      Yeni ilan karar kuyruğu
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-700 hover:bg-amber-100"
                  >
                    {pendingCount}
                  </Badge>
                </Link>
              </TabsTrigger>

              <TabsTrigger
                value="approved"
                asChild
                className="h-auto rounded-2xl border border-border/70 px-4 py-3 data-[state=active]:border-blue-300 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
              >
                <Link
                  href={`?status=approved${q ? `&q=${q}` : ""}`}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-semibold">Yayındaki ilanlar</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      Canlı envanter ve görünürlük
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-700 hover:bg-blue-100"
                  >
                    {approvedCount}
                  </Badge>
                </Link>
              </TabsTrigger>

              <TabsTrigger
                value="history"
                asChild
                className="h-auto rounded-2xl border border-border/70 px-4 py-3 data-[state=active]:border-slate-300 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Link
                  href={`?status=history${q ? `&q=${q}` : ""}`}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-semibold">Arşiv ve ret</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      Kapatılan veya reddedilen kayıtlar
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-muted px-2.5 py-1 font-bold text-muted-foreground hover:bg-muted"
                  >
                    {historyCount}
                  </Badge>
                </Link>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="m-0 bg-muted/10 p-0">
            <ListingsModeration pendingListings={listings} />
          </TabsContent>

          <TabsContent value="approved" className="m-0 bg-muted/10 p-0">
            <InventoryTable listings={listings} adminUserId={adminUser.id} />
          </TabsContent>

          <TabsContent value="history" className="m-0 bg-muted/10 p-0">
            <InventoryTable listings={listings} adminUserId={adminUser.id} />
          </TabsContent>

          <div className="border-t border-border/50 bg-background p-4 sm:p-5">
            <SimplePagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </Tabs>
      </section>
    </main>
  );
}
