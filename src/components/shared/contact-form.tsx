"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";

import { useTurnstile } from "@/hooks/use-turnstile";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { ApiClient } from "@/services/api-client";

const SUBJECTS = [
  "İlanımla ilgili sorun yaşıyorum",
  "Kurumsal üyelik hakkında bilgi",
  "Öneri / Şikayet",
  "Teknik destek",
  "Diğer",
] as const;

type Subject = (typeof SUBJECTS)[number];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [form, setForm] = useState<{
    name: string;
    email: string;
    subject: Subject;
    message: string;
  }>({ name: "", email: "", subject: SUBJECTS[0], message: "" });

  const {
    token: turnstileToken,
    containerRef,
    reset: resetTurnstile,
    isEnabled: isTurnstileEnabled,
  } = useTurnstile({
    action: "contact_form",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    // Turnstile check (only if enabled)
    if (isTurnstileEnabled && !turnstileToken) {
      setErrorMessage("Lütfen doğrulama kontrolünü tamamlayın.");
      return;
    }

    // Read honeypot value directly from the DOM to avoid React state
    const hp = (e.currentTarget.elements.namedItem("_hp") as HTMLInputElement | null)?.value ?? "";

    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await ApiClient.request(API_ROUTES.SUPPORT.CONTACT, {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          subject: form.subject,
          message: form.message,
          _hp: hp,
          turnstileToken: isTurnstileEnabled ? turnstileToken : undefined,
        }),
      });

      if (response.success) {
        setStatus("success");
        resetTurnstile();
      } else {
        setStatus("error");
        setErrorMessage(response.error?.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
        resetTurnstile();
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Bağlantı hatası. Lütfen tekrar deneyin."
      );
      resetTurnstile();
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-foreground">Mesajınız İletildi</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Mesajınızı aldık. Ekibimiz en kısa sürede size dönüş yapacak.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" });
          }}
          className="mt-2 text-xs font-bold text-primary hover:underline"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Adınız Soyadınız *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="Adınız Soyadınız"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">E-posta Adresiniz *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="ornek@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2">Konu</label>
        <select
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value as Subject }))}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-card transition"
        >
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2">Mesajınız *</label>
        <textarea
          rows={4}
          required
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition"
          placeholder="Mesajınızı buraya yazın..."
        />
      </div>
      {/*
        Honeypot field — hidden from real users via CSS, not `display:none` or
        `type="hidden"` (bots skip those). Bots fill it in; the API rejects them.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="_hp">Boş bırakın</label>
        <input id="_hp" name="_hp" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {/* Turnstile widget (invisible challenge) */}
      {isTurnstileEnabled && <div ref={containerRef} className="flex justify-center" />}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <LoaderCircle size={18} className="animate-spin" /> Gönderiliyor...
          </>
        ) : (
          <>
            <Send size={18} /> Mesajı Gönder
          </>
        )}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600 font-medium text-center">
          {errorMessage ||
            "Mesaj gönderilemedi. Lütfen tekrar deneyin veya doğrudan e-posta ile ulaşın."}
        </p>
      )}
    </form>
  );
}
