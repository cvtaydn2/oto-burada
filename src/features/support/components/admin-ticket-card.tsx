"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ticket, TicketStatus } from "@/features/support/services/ticket-service";
import { cn } from "@/lib/utils";

import { AdminTicketReplyForm } from "./admin-ticket-reply-form";

const CATEGORY_LABELS: Record<string, string> = {
  account: "Hesap",
  feedback: "Geri Bildirim",
  listing: "İlan",
  other: "Diğer",
  payment: "Ödeme",
  technical: "Teknik",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Düşük",
  medium: "Normal",
  high: "Yüksek",
  urgent: "Acil",
};

const STATUS_BADGES: Record<string, string> = {
  open: "border-amber-200 bg-amber-50 text-amber-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-50 text-slate-500",
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-500",
  medium: "border-slate-200 bg-slate-50 text-slate-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatTicketDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminTicketCardProps {
  ticket: Ticket;
  activeAction: string | null;
  replyingTo: string | null;
  onSetReplyingTo: (id: string | null) => void;
  onStatusChange: (id: string, status: TicketStatus) => void;
  onReplySubmit: (id: string, text: string) => void;
}

export const AdminTicketCard = React.memo(function AdminTicketCard({
  ticket,
  activeAction,
  replyingTo,
  onSetReplyingTo,
  onStatusChange,
  onReplySubmit,
}: AdminTicketCardProps) {
  const isReplying = activeAction === `${ticket.id}:reply`;
  const isMovingToInProgress = activeAction === `${ticket.id}:in_progress`;
  const isResolving = activeAction === `${ticket.id}:resolved`;
  const isBusy = isReplying || isMovingToInProgress || isResolving;
  const isReplyOpen = replyingTo === ticket.id;

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-border hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border font-semibold", STATUS_BADGES[ticket.status])}>
              {ticket.status === "open"
                ? "Açık"
                : ticket.status === "in_progress"
                  ? "İnceleniyor"
                  : ticket.status === "resolved"
                    ? "Çözüldü"
                    : "Kapatıldı"}
            </Badge>
            <Badge className={cn("border font-semibold", PRIORITY_BADGES[ticket.priority])}>
              {ticket.priority === "urgent" ? "Acil • " : ""}
              {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </Badge>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {CATEGORY_LABELS[ticket.category] ?? ticket.category}
            </span>
            {ticket.adminResponse && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Admin yanıtı mevcut
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">
              {ticket.subject}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground break-words whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-muted/30 px-3 py-2 border border-border/10">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Oluşturulma
              </span>
              <span className="mt-1 block font-medium text-foreground">
                {formatTicketDate(ticket.createdAt)}
              </span>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 border border-border/10">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Operasyon notu
              </span>
              <span className="mt-1 block font-medium text-foreground">
                {ticket.status === "resolved" || ticket.status === "closed"
                  ? "Kayıt kapanış sürecinde"
                  : "Yanıt veya durum kararı bekliyor"}
              </span>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2 border border-border/10 sm:col-span-2 xl:col-span-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                Sonraki önerilen adım
              </span>
              <span className="mt-1 block font-medium text-foreground">
                {ticket.adminResponse
                  ? "Kullanıcı geri dönüşünü izle"
                  : "Önce yanıt ver, sonra çözüm durumunu işaretle"}
              </span>
            </div>
          </div>

          {ticket.adminResponse && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 transition-all">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                Kayıtlı admin yanıtı
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900 break-words whitespace-pre-wrap">
                {ticket.adminResponse}
              </p>
            </div>
          )}
        </div>

        <div className="w-full xl:w-72 xl:flex-none">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
              Hızlı işlemler
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Destructive işlem yok. Bu yüzey yalnız kuyruk ilerletme ve görünür yanıt bırakma için
              kullanılır.
            </p>

            {isReplyOpen ? (
              <AdminTicketReplyForm
                ticketId={ticket.id}
                isBusy={isBusy}
                onReplySubmit={onReplySubmit}
                onCancel={() => onSetReplyingTo(null)}
              />
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  onClick={() => onSetReplyingTo(ticket.id)}
                  disabled={isBusy}
                  className="h-10 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-700 transition-all active:scale-95"
                >
                  Yanıt Yaz
                </Button>

                {ticket.status !== "in_progress" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onStatusChange(ticket.id, "in_progress")}
                    disabled={isBusy}
                    className="h-10 rounded-xl border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all active:scale-95"
                  >
                    {isMovingToInProgress ? "Güncelleniyor..." : "İncelemeye Al"}
                  </Button>
                )}

                {ticket.status !== "resolved" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onStatusChange(ticket.id, "resolved")}
                    disabled={isBusy}
                    className="h-10 rounded-xl border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all active:scale-95"
                  >
                    {isResolving ? "Güncelleniyor..." : "Çözüldü Olarak İşaretle"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});
