import { CreditCard, ShoppingBag, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { PlansTable } from "@/features/admin-moderation/components/plans-table";
import {
  getAdminPricingPlans,
  getPlanPurchases,
  getPlanStats,
} from "@/features/admin-moderation/services/plans";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { safeFormatDate } from "@/lib/datetime/date-utils";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Paket Yönetimi | OtoBurada",
  description:
    "Paket envanterini, satış özetini ve satın alma geçmişini yönetim panelinden inceleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/plans"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPlansPage() {
  await requireAdminUser();

  const [plans, purchases, stats] = await Promise.all([
    getAdminPricingPlans(),
    getPlanPurchases(),
    getPlanStats(),
  ]);

  return (
    <main className="min-h-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Gelir ve paketler
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Paket <span className="text-indigo-600">Yönetimi</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium italic text-muted-foreground">
            Paket envanterini, satış sinyallerini ve satın alma geçmişini operasyon açısından daha
            net katmanlarla yönetin.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm xl:max-w-sm">
          <p className="font-semibold">Operasyon notu</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Paket düzenleme, aktivasyon ve silme farklı risk seviyelerindedir. Bu yüzden destructive
            aksiyonlar ayrı modallarda tutulur ve geçmiş tablosu karar bağlamı sağlar.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Toplam gelir"
          value={formatCurrency(stats.totalRevenue)}
          hint="Başarılı ödeme akışı"
          tone="indigo"
          icon={TrendingUp}
        />
        <MetricCard
          label="Toplam satış"
          value={String(stats.totalSales)}
          hint="Tamamlanan paket satışı"
          tone="emerald"
          icon={ShoppingBag}
        />
        <MetricCard
          label="Aktif paket"
          value={String(plans.filter((plan) => plan.is_active).length)}
          hint="Yayında olan plan sayısı"
          tone="blue"
          icon={Users}
        />
      </section>

      {stats.byPlan.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/20 p-4 sm:p-6">
            <h2 className="text-sm font-bold text-foreground sm:text-base">
              Paket bazlı satış özeti
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Hangi planın ne kadar satış ve gelir ürettiğini hızlı karşılaştırma için
              sadeleştirildi.
            </p>
          </div>

          <div className="space-y-3 p-4 sm:hidden">
            {stats.byPlan.map((row) => (
              <article
                key={row.planName}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{row.planName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Paket performans özeti</p>
                  </div>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {formatCurrency(row.revenue)}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <InfoCell label="Satış" value={String(row.count)} />
                  <InfoCell label="Gelir" value={formatCurrency(row.revenue)} />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Paket
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Satış
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Gelir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.byPlan.map((row) => (
                  <tr key={row.planName} className="transition-colors hover:bg-indigo-50/20">
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {row.planName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                      {row.count}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background text-indigo-500 shadow-sm">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground sm:text-base">Paket listesi</h2>
            <p className="text-xs text-muted-foreground">
              Aktif/pasif planlar, özellik kapsamı ve aksiyon ayrımı aşağıda yer alır.
            </p>
          </div>
        </div>
        <PlansTable initialPlans={plans} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border/60 bg-muted/20 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-foreground sm:text-base">Satın alma geçmişi</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Geçmiş kayıtlar operasyonel audit için tutulur; kullanıcı, paket ve durum ilişkisi daha
            görünür hale getirildi.
          </p>
        </div>

        {purchases.length === 0 ? (
          <div className="px-4 py-14 text-center sm:px-6 sm:py-16">
            <ShoppingBag size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-foreground">Henüz paket satışı yok.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ödeme sistemi aktif olduğunda satın alma kayıtları burada akacaktır.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Migration gerekli: npm run db:migrate-payments
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 sm:hidden">
              {purchases.map((purchase) => (
                <article
                  key={purchase.id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {purchase.userName ?? "—"}
                      </h3>
                      <p className="mt-1 text-xs font-mono text-muted-foreground">
                        {purchase.userId.substring(0, 12)}...
                      </p>
                    </div>
                    <PurchaseStatusBadge status={purchase.status} />
                  </div>

                  <div className="mt-4 grid gap-2">
                    <InfoCell label="Paket" value={purchase.planName ?? "—"} />
                    <InfoCell label="Tutar" value={formatCurrency(purchase.amount)} />
                    <InfoCell
                      label="Tarih"
                      value={safeFormatDate(purchase.createdAt, "dd MMM yyyy HH:mm")}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Paket
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Tarih
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="transition-colors hover:bg-indigo-50/20">
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-semibold text-foreground">
                          {purchase.userName ?? "—"}
                        </p>
                        <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                          {purchase.userId.substring(0, 12)}...
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top text-sm font-semibold text-indigo-600">
                        {purchase.planName ?? "—"}
                      </td>
                      <td className="px-6 py-4 align-top text-sm font-semibold text-foreground">
                        {formatCurrency(purchase.amount)}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <PurchaseStatusBadge status={purchase.status} />
                      </td>
                      <td className="px-6 py-4 align-top text-xs font-medium text-muted-foreground">
                        {safeFormatDate(purchase.createdAt, "dd MMM yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "indigo" | "emerald" | "blue";
  icon: typeof TrendingUp;
}) {
  const toneClassName = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", toneClassName)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
        <Icon className="size-4" />
      </div>
      <p className="mt-3 break-words text-3xl font-bold leading-none">{value}</p>
      <p className="mt-2 text-xs leading-5 opacity-90">{hint}</p>
    </div>
  );
}

function PurchaseStatusBadge({ status }: { status: string }) {
  const config =
    status === "success"
      ? { label: "Başarılı", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : status === "pending"
        ? { label: "Bekliyor", className: "border-amber-200 bg-amber-50 text-amber-700" }
        : { label: "Başarısız", className: "border-rose-200 bg-rose-50 text-rose-700" };

  return <Badge className={config.className}>{config.label}</Badge>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  );
}
