import { ShieldAlert, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ReportsModeration } from "@/features/admin-moderation/components/reports-moderation";
import { requireAdminUser } from "@/features/auth/lib/session";
import { getStoredReports } from "@/features/reports/services/report-submissions";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { createSupabaseAdminClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Kullanıcı Raporları | OtoBurada",
  description:
    "Topluluk bildirimlerini, riskli raporları ve moderasyon kararlarını yönetim panelinden izleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/reports"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ urgent?: string; show?: string }>;
}) {
  await requireAdminUser();
  const { urgent, show } = await searchParams;

  const [storedReports] = await Promise.all([getStoredReports()]);

  let actionableReports =
    show === "all"
      ? storedReports
      : storedReports.filter((report) => report.status === "open" || report.status === "reviewing");

  if (urgent === "true") {
    actionableReports = actionableReports.filter((report) => report.reason === "fake_listing");
  }

  const listingIds = [...new Set(actionableReports.map((report) => report.listingId))];
  let listingMetaById: Record<string, { slug: string; title: string }> = {};

  if (listingIds.length > 0) {
    const admin = createSupabaseAdminClient();
    const { data: listingMeta } = await admin
      .from("listings")
      .select("id, title, slug")
      .in("id", listingIds);

    listingMetaById = Object.fromEntries(
      (listingMeta ?? []).map((listing) => [
        listing.id,
        { slug: listing.slug, title: listing.title },
      ])
    );
  }

  const openCount = actionableReports.filter((report) => report.status === "open").length;
  const reviewingCount = actionableReports.filter((report) => report.status === "reviewing").length;
  const resolvedCount = storedReports.filter((report) => report.status === "resolved").length;
  const dismissedCount = storedReports.filter((report) => report.status === "dismissed").length;

  return (
    <main className="min-h-full max-w-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Şikayet Denetimi
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Kullanıcı <span className="text-rose-600">Raporları</span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Topluluk bildirimlerini önceliklendirilmiş moderasyon kuyruğunda yönet ve kararları
                audit iziyle destekle.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700/80">
                Açık
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{openCount}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700/80">
                İncelemede
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {reviewingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/80">
                Çözüldü
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {resolvedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Geçersiz
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {dismissedCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-rose-200/60 bg-card shadow-sm">
            <div className="border-b border-rose-100/80 bg-rose-50/60 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-background text-rose-500 shadow-sm">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-tight text-rose-900">
                      İnceleme önceliği
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-rose-700/80">
                      Dolandırıcılık ve kapora şikayetleri her zaman ilk doğrulama katmanı olarak
                      ele alınmalı.
                    </p>
                  </div>
                </div>

                <Badge className="w-fit rounded-full border-none bg-white/90 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                  {actionableReports.length} görünür rapor
                </Badge>
              </div>
            </div>

            <div className="p-0 sm:p-1">
              <ReportsModeration listingMetaById={listingMetaById} reports={actionableReports} />
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-3xl border border-blue-200/70 bg-blue-600 p-5 text-white shadow-sm shadow-blue-100 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <TriangleAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Hızlı filtre</h3>
                <p className="mt-1 text-sm leading-6 text-blue-100">
                  Yüksek riskli şikayetleri ya da tüm geçmişi tek dokunuşla aç.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <Link
                href={urgent === "true" ? "/admin/reports" : "/admin/reports?urgent=true"}
                className="flex min-h-11 items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                <span>{urgent === "true" ? "Tümünü göster" : "Acil olanlar"}</span>
                <Badge className="rounded-full border-none bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {urgent === "true" ? "Sıfırla" : "Risk"}
                </Badge>
              </Link>
              <Link
                href={show === "all" ? "/admin/reports" : "/admin/reports?show=all"}
                className="flex min-h-11 items-center justify-between rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <span>{show === "all" ? "Sadece aktifler" : "Tüm geçmiş"}</span>
                <Badge className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">
                  {show === "all" ? "Canlı" : "Arşiv"}
                </Badge>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Durum özeti</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Filtre modu
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {urgent === "true"
                    ? "Sadece riskli raporlar"
                    : show === "all"
                      ? "Tüm geçmiş"
                      : "Açık ve incelemede"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Moderasyon notu
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Kapatma ve çözme kararlarında kısa bağlam notu bırakmak, audit ekranında takip
                  kolaylığı sağlar.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
