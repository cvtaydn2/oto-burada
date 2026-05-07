import { CreditCard, ShoppingBag, TrendingUp, Users } from "lucide-react";

import { PlansTable } from "@/features/admin-moderation/components/plans-table";
import {
  getAdminPricingPlans,
  getPlanPurchases,
  getPlanStats,
} from "@/features/admin-moderation/services/plans";
import { requireAdminUser } from "@/features/auth/lib/session";
import { formatCurrency, safeFormatDate } from "@/features/shared/lib";
import { Badge } from "@/features/ui/components/badge";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAdminUser();

  const [plans, purchases, stats] = await Promise.all([
    getAdminPricingPlans(),
    getPlanPurchases(),
    getPlanStats(),
  ]);

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-muted/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] italic">
              Gelir & Paketler
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Paket <span className="text-indigo-600">Yönetimi</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground font-medium italic">
            Üyelik paketlerini, satın alma geçmişini ve gelir istatistiklerini yönetin.
          </p>
        </div>
      </section>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-indigo-100 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
              Toplam Gelir
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground/70 font-bold mt-1 uppercase tracking-wider">
            Başarılı ödemeler
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
              Toplam Satış
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalSales}</p>
          <p className="text-[10px] text-muted-foreground/70 font-bold mt-1 uppercase tracking-wider">
            Paket satışı
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
              Aktif Paket
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {plans.filter((p) => p.is_active).length}
          </p>
          <p className="text-[10px] text-muted-foreground/70 font-bold mt-1 uppercase tracking-wider">
            Yayında olan paket
          </p>
        </div>
      </div>

      {/* Paket Bazlı Satış Özeti */}
      {stats.byPlan.length > 0 && (
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-bold text-foreground">Paket Bazlı Satış Özeti</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Paket
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Satış
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Gelir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.byPlan.map((row) => (
                  <tr key={row.planName} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-foreground">{row.planName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-muted-foreground">
                      {row.count}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paket Listesi */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center text-indigo-500 shadow-sm">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Paket Listesi</h3>
            <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-tighter">
              Aktif ve pasif planlar
            </p>
          </div>
        </div>
        <PlansTable initialPlans={plans} />
      </div>

      {/* Satın Alma Geçmişi */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/30">
          <h3 className="text-sm font-bold text-foreground">
            Satın Alma Geçmişi
            {purchases.length === 0 && (
              <span className="ml-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                — Ödeme sistemi aktif olduğunda burada görünecek
              </span>
            )}
          </h3>
        </div>

        {purchases.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-bold text-muted-foreground/70 uppercase tracking-widest">
              Henüz paket satışı yok
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Ödeme sistemi entegre edildiğinde satın almalar burada görünecek.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                Migration gerekli: npm run db:migrate-payments
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Paket
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-foreground">{p.userName ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground/70 font-mono">
                        {p.userId.substring(0, 12)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-indigo-600">{p.planName ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={
                          p.status === "success"
                            ? "bg-emerald-100 text-emerald-700 border-none text-[9px] font-bold uppercase"
                            : p.status === "pending"
                              ? "bg-amber-100 text-amber-700 border-none text-[9px] font-bold uppercase"
                              : "bg-rose-100 text-rose-700 border-none text-[9px] font-bold uppercase"
                        }
                      >
                        {p.status === "success"
                          ? "Başarılı"
                          : p.status === "pending"
                            ? "Bekliyor"
                            : "Başarısız"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                      {safeFormatDate(p.createdAt, "dd MMM yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
