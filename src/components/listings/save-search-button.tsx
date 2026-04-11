"use client";

import Link from "next/link";
import { BellRing, CheckCircle2, LoaderCircle, LogIn } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { hasMeaningfulSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";
import type { ListingFilters } from "@/types";

interface SaveSearchButtonProps {
  filters: ListingFilters;
  resultCount: number;
  userId?: string | null;
}

export function SaveSearchButton({
  filters,
  resultCount,
  userId,
}: SaveSearchButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | "idle" | "success">("idle");
  const canSave = hasMeaningfulSavedSearchFilters(filters);

  const handleSave = async () => {
    if (!canSave) {
      setStatus("error");
      setMessage("Arama kaydetmek için en az bir filtre seçmelisin.");
      return;
    }

    setIsSaving(true);
    setStatus("idle");
    setMessage(null);

    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters,
          notificationsEnabled: true,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        success?: boolean;
        error?: { message?: string };
        message?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        setStatus("error");
        setMessage(payload?.error?.message ?? "Arama kaydedilemedi.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Araman kaydedildi.");
    } catch {
      setStatus("error");
      setMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userId) {
    return (
      <div className="space-y-2">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
        >
          <LogIn className="size-4" />
          Giriş yap ve aramayı kaydet
        </Link>
        <p className="text-xs text-slate-500">
          Kayıtlı aramalar yeni sonuçları dashboard&apos;dan takip etmeni sağlar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <BellRing className="size-4" />}
        {isSaving ? "Kaydediliyor..." : `Aramayı Kaydet (${resultCount})`}
      </button>

      {message ? (
        <p
          className={cn(
            "text-xs",
            status === "error" ? "text-destructive" : "text-emerald-700",
          )}
        >
          {status === "success" ? <CheckCircle2 className="mr-1 inline size-3.5" /> : null}
          {message}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Mevcut filtre kombinasyonunu kaydedip yeni uygun ilanlar geldiğinde tekrar dön.
        </p>
      )}
    </div>
  );
}
