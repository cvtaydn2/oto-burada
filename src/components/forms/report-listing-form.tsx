"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { useCsrfToken } from "@/components/providers/csrf-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { reportReasonLabels, reportReasons } from "@/lib/constants/domain";

interface ReportListingFormProps {
  listingId: string;
  sellerId: string;
  userId?: string | null;
  onSuccess?: () => void;
}

interface SubmitState {
  message?: string;
  status: "error" | "idle" | "success";
}

export function ReportListingForm({
  listingId,
  sellerId,
  userId,
  onSuccess,
}: ReportListingFormProps) {
  const { token: csrfToken } = useCsrfToken();
  const [reason, setReason] = useState<(typeof reportReasons)[number]>("fake_listing");
  const [description, setDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!userId) {
    return (
      <Link
        href="/login"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2"
      >
        <AlertTriangle className="size-4" />
        Şüpheli İlanı Bildir
      </Link>
    );
  }

  if (userId === sellerId) {
    return (
      <div className="rounded-xl border border-border bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
        Kendi ilanını raporlayamazsın.
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ status: "idle" });

    try {
      const response = await fetch("/api/reports", {
        body: JSON.stringify({
          description,
          listingId,
          reason,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message: string };
        message?: string;
        data?: { message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        setSubmitState({
          message: payload?.error?.message ?? "Rapor gönderilemedi.",
          status: "error",
        });
        return;
      }

      setDescription("");
      setSubmitState({
        message: payload?.message ?? "Raporun incelemeye alındı.",
        status: "success",
      });
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch {
      setSubmitState({
        message: "Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/5 via-background to-background p-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="size-4" />
        Şüpheli ilanı bildir
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Kapora isteme, sahte ilan veya yanlış bilgi şüphelerinde doğrudan moderasyon ekibine
        bildirim gönderebilirsin.
      </p>

      <Label className="block space-y-2 text-sm font-medium text-foreground">
        <span>Bildirim nedeni</span>
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value as (typeof reportReasons)[number])}
          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {reportReasons.map((value) => (
            <option key={value} value={value}>
              {reportReasonLabels[value]}
            </option>
          ))}
        </select>
      </Label>

      <Label className="block space-y-2 text-sm font-medium text-foreground">
        <span>Açıklama (opsiyonel)</span>
        <textarea
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Sorunu kısaca açıkla. Açıklama girersen en az 5 karakter olmalı."
          className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </Label>

      {submitState.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {submitState.message}
        </p>
      ) : null}

      {submitState.status === "success" ? (
        <p aria-live="polite" className="text-sm text-primary">
          {submitState.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-background px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <AlertTriangle className="size-4" />
        )}
        {isSubmitting ? "Rapor gönderiliyor..." : "Raporu gönder"}
      </Button>
    </form>
  );
}
