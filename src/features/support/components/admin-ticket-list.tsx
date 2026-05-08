"use client";

import { Clock3, LifeBuoy, MessageSquareReply, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Ticket, TicketStatus } from "@/features/support/services/ticket-service";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { cn } from "@/lib";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "İnceleniyor" },
  { value: "resolved", label: "Çözüldü" },
  { value: "closed", label: "Kapatıldı" },
];

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

interface AdminTicketListProps {
  tickets: Ticket[];
  initialStatus?: TicketStatus | "all";
  initialQuery?: string;
}

function getStatusLabel(status: TicketStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function formatTicketDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [reply, setReply] = useState("");
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
      STATUS_OPTIONS.reduce<Record<TicketStatus, number>>(
        (acc, option) => {
          acc[option.value] = tickets.filter((ticket) => ticket.status === option.value).length;
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

      toast.success(`${getStatusLabel(status)} durumuna alındı`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Güncelleme başarısız");
    } finally {
      setActiveAction(null);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!reply.trim()) {
      return;
    }

    setActiveAction(`${ticketId}:reply`);

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress", adminResponse: reply.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Yanıt gönderilemedi.");
      }

      toast.success("Yanıt gönderildi ve talep incelemeye alındı");
      setReplyingTo(null);
      setReply("");
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

  const hasFilteredResults = filtered.length > 0;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Operasyon görünümü
              </p>
              <h4 className="mt-1 text-sm font-semibold text-foreground">
                Kuyruk, durum ve yanıt sinyalleri aynı yüzeyde toplandı.
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              <SummaryPill icon={LifeBuoy} label="Toplam" value={tickets.length} tone="default" />
              <SummaryPill
                icon={Clock3}
                label="Açık"
                value={statusCounts.open + statusCounts.in_progress}
                tone="warning"
              />
              <SummaryPill
                icon={ShieldCheck}
                label="Çözüldü"
                value={statusCounts.resolved + statusCounts.closed}
                tone="success"
              />
              <SummaryPill
                icon={MessageSquareReply}
                label="Yanıtlandı"
                value={repliedCount}
                tone="info"
              />
            </div>
          </div>

          <div className="w-full max-w-xl space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Konu, açıklama veya sorun tipi ara..."
                className="h-11 rounded-xl border-border/70 bg-background pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam <span className="font-semibold text-foreground">{filtered.length}</span> kayıt
              gösteriliyor. Yanıt eklemek ilgili kaydı otomatik olarak{" "}
              <span className="font-semibold">İnceleniyor</span> durumuna taşır.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={`Tümü (${tickets.length})`}
          />
          {STATUS_OPTIONS.map((status) => (
            <FilterChip
              key={status.value}
              active={filter === status.value}
              onClick={() => setFilter(status.value)}
              label={`${status.label} (${statusCounts[status.value]})`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {hasFilteredResults ? (
          filtered.map((ticket) => {
            const isReplying = activeAction === `${ticket.id}:reply`;
            const isMovingToInProgress = activeAction === `${ticket.id}:in_progress`;
            const isResolving = activeAction === `${ticket.id}:resolved`;
            const isBusy = isReplying || isMovingToInProgress || isResolving;
            const isReplyOpen = replyingTo === ticket.id;

            return (
              <article
                key={ticket.id}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-border sm:p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("border font-semibold", STATUS_BADGES[ticket.status])}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                      <Badge
                        className={cn("border font-semibold", PRIORITY_BADGES[ticket.priority])}
                      >
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
                      <p className="text-sm leading-6 text-muted-foreground break-words">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl bg-muted/30 px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                          Oluşturulma
                        </span>
                        <span className="mt-1 block font-medium text-foreground">
                          {formatTicketDate(ticket.createdAt)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                          Operasyon notu
                        </span>
                        <span className="mt-1 block font-medium text-foreground">
                          {ticket.status === "resolved" || ticket.status === "closed"
                            ? "Kayıt kapanış sürecinde"
                            : "Yanıt veya durum kararı bekliyor"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-3 py-2 sm:col-span-2 xl:col-span-1">
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
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Kayıtlı admin yanıtı
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-900 break-words">
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
                        Destructive işlem yok. Bu yüzey yalnız kuyruk ilerletme ve görünür yanıt
                        bırakma için kullanılır.
                      </p>

                      {isReplyOpen ? (
                        <div className="mt-4 space-y-3">
                          <textarea
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            placeholder="Kullanıcıya net, izlenebilir ve kısa bir yanıt yazın..."
                            className="min-h-[112px] w-full rounded-xl border border-border/70 bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                          <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                            Gönderilen metin ticket kaydında görünür ve audit akışında karar bağlamı
                            sağlar.
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              onClick={() => handleReply(ticket.id)}
                              disabled={isBusy || !reply.trim()}
                              className="h-10 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-700"
                            >
                              {isReplying ? "Gönderiliyor..." : "Yanıtı Kaydet ve İncelemeye Al"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReply("");
                              }}
                              disabled={isBusy}
                              className="h-10 rounded-xl"
                            >
                              Vazgeç
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-col gap-2">
                          <Button
                            onClick={() => setReplyingTo(ticket.id)}
                            disabled={isBusy}
                            className="h-10 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-700"
                          >
                            Yanıt Yaz
                          </Button>

                          {ticket.status !== "in_progress" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleStatusChange(ticket.id, "in_progress")}
                              disabled={isBusy}
                              className="h-10 rounded-xl border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                            >
                              {isMovingToInProgress ? "Güncelleniyor..." : "İncelemeye Al"}
                            </Button>
                          )}

                          {ticket.status !== "resolved" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleStatusChange(ticket.id, "resolved")}
                              disabled={isBusy}
                              className="h-10 rounded-xl border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
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
          })
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

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 text-xs font-semibold transition-colors",
        active
          ? "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
      )}
    >
      {label}
    </Button>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof LifeBuoy;
  label: string;
  value: number;
  tone: "default" | "warning" | "success" | "info";
}) {
  const toneClassName = {
    default: "border-border/70 bg-background text-foreground",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-3 py-3", toneClassName)}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold leading-none">{value}</p>
    </div>
  );
}
