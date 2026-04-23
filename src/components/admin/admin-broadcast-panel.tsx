"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Megaphone } from "lucide-react";
import { useState } from "react";

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
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload || !payload.success) {
        setStatus("error");
        setErrorMsg(payload?.error?.message || "Duyuru g├Ânderilemedi.");
        return;
      }

      setStatus("success");
      setTitle("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg("Ba─şlant─▒ hatas─▒ olu┼ştu.");
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
          <h2 className="text-xl font-bold text-foreground">Sistem Duyurusu G├Ânder</h2>
          <p className="text-sm text-muted-foreground">
            T├╝m kullan─▒c─▒lara anl─▒k bildirim g├Ânderir.
          </p>
        </div>
      </div>

      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Duyuru Ba┼şl─▒─ş─▒
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSending}
            placeholder="├ûrn: Hafta Sonu Bak─▒m ├çal─▒┼şmas─▒"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Mesaj ─░├ğeri─şi
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            placeholder="Duyuru detaylar─▒n─▒ buraya yaz─▒n..."
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        {status === "success" && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-medium">
            <CheckCircle2 size={18} />
            Duyuru t├╝m kullan─▒c─▒lara ba┼şar─▒yla iletildi.
          </div>
        )}

        {status === "error" && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-sm font-medium">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSending || !title || !message}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/20"
        >
          {isSending ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              G├Ânderiliyor...
            </>
          ) : (
            <>
              <Megaphone size={18} />
              ┼Şimdi Yay─▒nla
            </>
          )}
        </button>
      </form>
    </section>
  );
}
