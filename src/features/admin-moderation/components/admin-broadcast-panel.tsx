"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Megaphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClient } from "@/lib/api/client";

export function AdminBroadcastPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSending(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const response = await ApiClient.request<{
        successCount: number;
        failCount: number;
        totalProcessed: number;
      }>("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ title, message }),
      });

      if (!response.success) {
        setStatus("error");
        setErrorMsg(
          response.error?.message ===
            "Güvenlik doğrulaması gerekiyor. Lütfen kimliğinizi doğrulayın."
            ? "Bu işlem için ek güvenlik doğrulaması gerekiyor. Lütfen güvenlik doğrulamasını tamamlayıp tekrar deneyin."
            : (response.error?.message ?? "Duyuru gönderilemedi.")
        );
        return;
      }

      setStatus("success");
      setTitle("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg("Bağlantı hatası oluştu.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <Megaphone size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Sistem Duyurusu Gönder</h2>
          <p className="text-sm text-muted-foreground">
            Tüm kullanıcılara anlık bildirim gönderir.
          </p>
        </div>
      </div>

      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Duyuru Başlığı
          </Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSending}
            placeholder="Örn: Hafta Sonu Bakım Çalışması"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Mesaj İçeriği
          </Label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            placeholder="Duyuru detaylarını buraya yazın..."
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        {status === "success" && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-medium">
            <CheckCircle2 size={18} />
            Duyuru tüm kullanıcılara başarıyla iletildi.
          </div>
        )}

        {status === "error" && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-sm font-medium">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSending || !title || !message}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/20"
        >
          {isSending ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Megaphone size={18} />
              Şimdi Yayınla
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
