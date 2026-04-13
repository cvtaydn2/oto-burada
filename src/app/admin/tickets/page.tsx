import { requireAdminUser } from "@/lib/auth/session";
import { getAllTickets, getTicketCount } from "@/services/support/ticket-service";
import { AdminTicketList } from "@/components/support/admin-ticket-list";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  await requireAdminUser();
  const [tickets, counts] = await Promise.all([
    getAllTickets(),
    getTicketCount(),
  ]);

  const openCount = counts.open + counts.in_progress;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Destek</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Destek Talepleri</h1>
        <p className="text-sm text-slate-500 mt-1">Kullanıcılardan gelen destek taleplerini yönetin.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Açık" count={counts.open} color="text-amber-600 bg-amber-50" />
        <StatCard label="İnceleniyor" count={counts.in_progress} color="text-blue-600 bg-blue-50" />
        <StatCard label="Çözüldü" count={counts.resolved} color="text-emerald-600 bg-emerald-50" />
        <StatCard label="Kapatıldı" count={counts.closed} color="text-slate-600 bg-slate-50" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Tüm Talepler {openCount > 0 && <span className="ml-2 text-sm text-amber-600">({openCount} bekleyen)</span>}
          </h2>
        </div>
        <AdminTicketList tickets={tickets} />
      </div>
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
      <p className={`text-3xl font-black ${color}`}>{count}</p>
      <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
