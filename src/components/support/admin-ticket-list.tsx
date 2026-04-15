"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ticket, TicketStatus } from "@/services/support/ticket-service";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "İnceleniyor" },
  { value: "resolved", label: "Çözüldü" },
  { value: "closed", label: "Kapatıldı" },
];

const STATUS_BADGES: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-50 text-slate-500 border-slate-200",
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-slate-50 text-slate-500",
  medium: "bg-slate-50 text-slate-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

interface AdminTicketListProps {
  tickets: Ticket[];
  initialStatus?: TicketStatus | "all";
  initialQuery?: string;
}

export function AdminTicketList({ tickets: initialTickets, initialStatus = "all", initialQuery = "" }: AdminTicketListProps) {
  const router = useRouter();
  const [tickets] = useState(initialTickets);
  const [filter, setFilter] = useState<TicketStatus | "all">(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const filtered = tickets
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) =>
      !searchQuery ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Durum güncellendi");
      router.refresh();
    } catch {
      toast.error("Güncelleme başarısız");
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!reply.trim()) return;
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress", adminResponse: reply.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Yanıt gönderildi");
      setReplyingTo(null);
      setReply("");
      router.refresh();
    } catch {
      toast.error("Yanıt gönderilemedi");
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Henüz destek talebi bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Arama */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Konu veya içerik ara..."
        className="w-full h-10 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 transition-all"
      />
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
            filter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
          }`}
        >
          Tümü ({tickets.length})
        </button>
        {STATUS_OPTIONS.map((s) => {
          const count = tickets.filter((t) => t.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                filter === s.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((ticket) => (
          <div key={ticket.id} className="rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${STATUS_BADGES[ticket.status]}`}>
                    {STATUS_OPTIONS.find((s) => s.value === ticket.status)?.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${PRIORITY_BADGES[ticket.priority]}`}>
                    {ticket.priority === "urgent" ? "⚡ " : ""}{ticket.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{ticket.category}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{ticket.subject}</h3>
                <p className="text-xs text-slate-500 mt-1">{ticket.description}</p>
                {ticket.adminResponse && (
                  <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-xs font-medium text-emerald-700">Yanıtınız: {ticket.adminResponse}</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  {new Date(ticket.createdAt).toLocaleDateString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {replyingTo === ticket.id ? (
              <div className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Kullanıcıya yanıt yazın..."
                  className="w-full min-h-[80px] rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReply(ticket.id)}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Yanıt Gönder
                  </button>
                  <button
                    onClick={() => { setReplyingTo(null); setReply(""); }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setReplyingTo(ticket.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                >
                  Yanıtla
                </button>
                {ticket.status !== "in_progress" && (
                  <button
                    onClick={() => handleStatusChange(ticket.id, "in_progress")}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                  >
                    İncelemeye Al
                  </button>
                )}
                {ticket.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChange(ticket.id, "resolved")}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Çözüldü İşaretle
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
