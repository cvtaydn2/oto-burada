import { Clock3, MessageSquare, ShieldCheck } from "lucide-react";

import { requireAdminUser } from "@/features/auth/lib/session";
import { AdminTicketList } from "@/features/support/components/admin-ticket-list";
import type { TicketStatus } from "@/features/support/services/ticket-service";
import { getAllTickets, getTicketCount } from "@/features/support/services/ticket-service";
import { cn } from "@/lib";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminUser();
  const { status, q } = await searchParams;

  const [allTickets, counts] = await Promise.all([getAllTickets(), getTicketCount()]);

  const openCount = counts.open + counts.in_progress;
  const resolvedCount = counts.resolved + counts.closed;

  return (
    <main className="min-h-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Müşteri deneyimi
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Destek <span className="text-emerald-600">Talepleri</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium italic text-muted-foreground">
            Gelen yardım çağrılarını, yanıt kayıtlarını ve kuyruk durumunu mobilde de okunabilir tek
            yüzeyde yönetin.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm xl:max-w-sm">
          <p className="font-semibold">Operasyon notu</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Yanıt eklemek ticket kaydına bağlamsal iz bırakır. Kapatma veya çözüm kararından önce
            kısa bir admin cevabı bırakmanız önerilir.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Açık kuyruk"
          count={openCount}
          hint="Yanıt veya inceleme bekliyor"
          tone="warning"
          icon={Clock3}
        />
        <StatCard
          label="Açık"
          count={counts.open}
          hint="Henüz işlem alınmadı"
          tone="warning-soft"
          icon={MessageSquare}
        />
        <StatCard
          label="İnceleniyor"
          count={counts.in_progress}
          hint="Admin aksiyonu başlatıldı"
          tone="info"
          icon={ShieldCheck}
        />
        <StatCard
          label="Kapanan kayıt"
          count={resolvedCount}
          hint="Çözüldü veya kapatıldı"
          tone="success"
          icon={ShieldCheck}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background text-emerald-500 shadow-sm">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground sm:text-base">Tüm talepler</h2>
              <p className="text-xs text-muted-foreground">
                Toplam {allTickets.length} kayıt • filtreler ve aksiyonlar aşağıda
              </p>
            </div>
          </div>
          {openCount > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              <div className="size-2 rounded-full bg-amber-500" />
              {openCount} kayıt halen kuyrukta
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              <div className="size-2 rounded-full bg-emerald-500" />
              Aktif kuyruk temiz görünüyor
            </div>
          )}
        </div>

        <AdminTicketList
          tickets={allTickets}
          initialStatus={(status as TicketStatus) ?? "all"}
          initialQuery={q ?? ""}
        />
      </section>
    </main>
  );
}

function StatCard({
  label,
  count,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  count: number;
  hint: string;
  tone: "warning" | "warning-soft" | "info" | "success";
  icon: typeof Clock3;
}) {
  const toneClassName = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    "warning-soft": "border-amber-100 bg-card text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", toneClassName)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-3xl font-bold leading-none">{count}</p>
      <p className="mt-2 text-xs leading-5 opacity-90">{hint}</p>
    </div>
  );
}
