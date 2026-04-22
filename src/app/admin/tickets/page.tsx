import { MessageSquare } from "lucide-react";

import { AdminTicketList } from "@/components/support/admin-ticket-list";
import { requireAdminUser } from "@/lib/auth/session";
import type { TicketStatus } from "@/services/support/ticket-service";
import { getAllTickets, getTicketCount } from "@/services/support/ticket-service";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminUser();
  const { status, q } = await searchParams;

  const [allTickets, counts] = await Promise.all([getAllTickets(), getTicketCount()]);

  // Client-side filter için tüm ticketları gönder, filtreleme component'te
  const openCount = counts.open + counts.in_progress;

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-muted/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] italic">
              Müşteri Deneyimi
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Destek <span className="text-emerald-600">Talepleri</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground font-medium italic">
            Kullanıcılardan gelen yardım çağrılarını yönetin.
          </p>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2">
            <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
              {openCount} bekleyen talep
            </span>
          </div>
        )}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Açık"
          count={counts.open}
          color="text-amber-600 bg-amber-50 border-amber-100"
        />
        <StatCard
          label="İnceleniyor"
          count={counts.in_progress}
          color="text-blue-600 bg-blue-50 border-blue-100"
        />
        <StatCard
          label="Çözüldü"
          count={counts.resolved}
          color="text-emerald-600 bg-emerald-50 border-emerald-100"
        />
        <StatCard
          label="Kapatıldı"
          count={counts.closed}
          color="text-muted-foreground bg-muted/30 border-border/50"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center text-emerald-500 shadow-sm">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            Tüm Talepler
            <span className="ml-2 text-muted-foreground/70 font-bold">({allTickets.length})</span>
          </h3>
        </div>

        <AdminTicketList
          tickets={allTickets}
          initialStatus={(status as TicketStatus) ?? "all"}
          initialQuery={q ?? ""}
        />
      </div>
    </main>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{label}</p>
    </div>
  );
}
