"use client";

import type { Ticket } from "@/services/support/ticket-service";

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  in_progress: "İnceleniyor",
  resolved: "Çözüldü",
  closed: "Kapatıldı",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-50 text-slate-500 border-slate-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Düşük",
  medium: "Normal",
  high: "Yüksek",
  urgent: "Acil",
};

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) return null;

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS[ticket.status] ?? STATUS_COLORS.closed}`}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {ticket.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 truncate">{ticket.subject}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
              {ticket.adminResponse && (
                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs font-medium text-slate-700">{ticket.adminResponse}</p>
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400">
                {new Date(ticket.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
