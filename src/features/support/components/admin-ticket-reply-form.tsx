"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

interface AdminTicketReplyFormProps {
  ticketId: string;
  isBusy: boolean;
  onReplySubmit: (ticketId: string, replyText: string) => void;
  onCancel: () => void;
}

export const AdminTicketReplyForm = React.memo(function AdminTicketReplyForm({
  ticketId,
  isBusy,
  onReplySubmit,
  onCancel,
}: AdminTicketReplyFormProps) {
  const [reply, setReply] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    onReplySubmit(ticketId, reply.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        placeholder="Kullanıcıya net, izlenebilir ve kısa bir yanıt yazın..."
        className="min-h-[112px] w-full rounded-xl border border-border/70 bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        maxLength={1000}
      />
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span>Metin ticket kaydında görünecektir.</span>
        <span className="font-mono">{reply.length}/1000</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={isBusy || !reply.trim()}
          className="h-10 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-700 transition-all active:scale-95"
        >
          {isBusy ? "Gönderiliyor..." : "Yanıtı Kaydet ve İncelemeye Al"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isBusy}
          className="h-10 rounded-xl transition-all active:scale-95"
        >
          Vazgeç
        </Button>
      </div>
    </form>
  );
});
