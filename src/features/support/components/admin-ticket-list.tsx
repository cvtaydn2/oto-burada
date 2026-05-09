"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Ticket, TicketStatus } from "@/features/support/services/ticket-service";

import { AdminTicketCard } from "./admin-ticket-card";
import { AdminTicketListHeader } from "./admin-ticket-list-header";

interface AdminTicketListProps {
  tickets: Ticket[];
  initialStatus?: TicketStatus | "all";
  initialQuery?: string;
}

export function AdminTicketList({
  tickets: initialTickets,
  initialStatus = "all",
  initialQuery = "",
}: AdminTicketListProps) {
  const router = useRouter();
  const [tickets] = useState(initialTickets);
  const [filter, setFilter] = useState<TicketStatus | "all">(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tickets
        .filter((ticket) => filter === "all" || ticket.status === filter)
        .filter(
          (ticket) =>
            !searchQuery ||
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [tickets, filter, searchQuery]
  );

  const statusCounts = useMemo(
    () =>
      tickets.reduce<Record<TicketStatus, number>>(
        (acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] ?? 0) + 1;
          return acc;
        },
        { open: 0, in_progress: 0, resolved: 0, closed: 0 }
      ),
    [tickets]
  );

  const repliedCount = useMemo(
    () => tickets.filter((ticket) => Boolean(ticket.adminResponse)).length,
    [tickets]
  );

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    setActiveAction(`${ticketId}:${status}`);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Durum güncellenemedi.");
      }

      toast.success("Durum güncellendi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Güncelleme başarısız");
    } finally {
      setActiveAction(null);
    }
  };

  const handleReply = async (ticketId: string, text: string) => {
    setActiveAction(`${ticketId}:reply`);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress", adminResponse: text }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Yanıt gönderilemedi.");
      }

      toast.success("Yanıt gönderildi ve talep incelemeye alındı");
      setReplyingTo(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yanıt gönderilemedi");
    } finally {
      setActiveAction(null);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-foreground">Henüz destek talebi bulunmuyor.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Yeni talepler geldiğinde bu kuyrukta inceleme ve yanıt adımları görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <AdminTicketListHeader
        totalCount={tickets.length}
        openCount={statusCounts.open + statusCounts.in_progress}
        resolvedCount={statusCounts.resolved + statusCounts.closed}
        repliedCount={repliedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        filteredCount={filtered.length}
        statusCounts={statusCounts}
      />

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((ticket) => (
            <AdminTicketCard
              key={ticket.id}
              ticket={ticket}
              activeAction={activeAction}
              replyingTo={replyingTo}
              onSetReplyingTo={setReplyingTo}
              onStatusChange={handleStatusChange}
              onReplySubmit={handleReply}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              Filtreyle eşleşen destek talebi bulunamadı.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Arama terimini temizleyin veya farklı bir durum filtresi seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
