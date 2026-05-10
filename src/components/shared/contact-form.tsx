"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurnstile } from "@/hooks/use-turnstile";
import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";

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
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-foreground">Mesajınız iletildi</h3>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Mesajınızı aldık. Ekibimiz en kısa sürede size dönüş yapacak.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStatus("idle");
            setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" });
          }}
          className="mt-2 rounded-xl"
        >
          Yeni mesaj gönder
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-xs font-bold text-foreground">
            Adınız Soyadınız *
          </Label>
          <Input
            id="contact-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-12 rounded-xl border-border/80 bg-background px-4 text-sm"
            placeholder="Adınız Soyadınız"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email" className="text-xs font-bold text-foreground">
            E-posta Adresiniz *
          </Label>
          <Input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="h-12 rounded-xl border-border/80 bg-background px-4 text-sm"
            placeholder="ornek@email.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject" className="text-xs font-bold text-foreground">
          Konu
        </Label>
        <select
          id="contact-subject"
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value as Subject }))}
          className="h-12 w-full rounded-xl border border-border/80 bg-background px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message" className="text-xs font-bold text-foreground">
          Mesajınız *
        </Label>
        <textarea
          id="contact-message"
          rows={5}
          required
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="min-h-[140px] w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          placeholder="Mesajınızı buraya yazın..."
        />
      </div>
      {/*
        Honeypot field — hidden from real users via CSS, not `display:none` or
        `type="hidden"` (bots skip those). Bots fill it in; the API rejects them.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <Label htmlFor="_hp">Boş bırakın</Label>
        <Input id="_hp" name="_hp" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {isTurnstileEnabled && <div ref={containerRef} className="flex justify-center" />}
      <Button
        type="submit"
        disabled={status === "loading"}
        className="h-12 w-full rounded-xl text-sm font-semibold"
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
      </Button>
      {status === "error" && (
        <p
          role="alert"
          className="animate-in slide-in-from-top-1 text-center text-sm font-medium text-destructive"
        >
          {errorMessage ||
            "Mesaj gönderilemedi. Lütfen tekrar deneyin veya doğrudan e-posta ile ulaşın."}
        </p>
      )}
    </form>
  );
}
