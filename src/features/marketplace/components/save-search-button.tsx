"use client";

import { BellRing, CheckCircle2, LoaderCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { saveSearchAction } from "@/app/dashboard/saved-searches/actions";
import { Button } from "@/components/ui/button";
import { hasMeaningfulSavedSearchFilters } from "@/features/marketplace/services/saved-search-utils";
import {} from "@/lib";
import { cn } from "@/lib/utils";
import type { ListingFilters } from "@/types";

interface SaveSearchButtonProps {
  filters: ListingFilters;
  resultCount: number;
  userId?: string | null;
  variant?: "default" | "compact";
}

export function SaveSearchButton({
  filters,
  resultCount,
  userId,
  variant = "default",
}: SaveSearchButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | "idle" | "success">("idle");
  const canSave = hasMeaningfulSavedSearchFilters(filters);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginHref = `/login?next=${encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`)}`;

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
      const result = await saveSearchAction(filters, true);

      if (!result.success) {
        setStatus("error");
        setMessage(result.error ?? "Arama kaydedilemedi.");
        return;
      }

      setStatus("success");
      setMessage(result.message ?? "Araman kaydedildi.");
    } catch {
      setStatus("error");
      setMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userId) {
    if (variant === "compact") {
      return (
        <Link
          href={loginHref}
          title="Giriş yap ve aramayı kaydet"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted/50 transition-all uppercase tracking-widest"
        >
          <LogIn className="size-3.5" />
          <span className="hidden md:inline">Aramayı Kaydet</span>
        </Link>
      );
    }

    return (
      <div className="space-y-2">
        <Link
          href={loginHref}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground/90 transition-all hover:bg-muted/30"
        >
          <LogIn className="size-4" />
          Giriş yap ve aramayı kaydet
        </Link>
        <p className="text-xs text-muted-foreground">
          Kayıtlı aramalar yeni sonuçları dashboard&apos;dan takip etmeni sağlar.
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted/50 transition-all uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <BellRing className={cn("size-3.5", status === "success" && "text-emerald-600")} />
          )}
          <span className="hidden md:inline">
            {isSaving ? "Kaydediliyor..." : status === "success" ? "Kaydedildi" : "Aramayı Kaydet"}
          </span>
        </Button>
        {message && (
          <div
            className={cn(
              "absolute top-full right-0 mt-2 z-50 w-48 p-2 rounded-lg border shadow-lg text-[10px] font-bold uppercase tracking-tight",
              status === "error"
                ? "bg-destructive/10 border-destructive text-destructive"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            )}
          >
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground/90 transition-all hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <BellRing className="size-4" />
        )}
        {isSaving ? "Kaydediliyor..." : `Aramayı Kaydet (${resultCount})`}
      </Button>

      {message ? (
        <p className={cn("text-xs", status === "error" ? "text-destructive" : "text-emerald-700")}>
          {status === "success" ? <CheckCircle2 className="mr-1 inline size-3.5" /> : null}
          {message}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Mevcut filtre kombinasyonunu kaydedip yeni uygun ilanlar geldiğinde tekrar dön.
        </p>
      )}
    </div>
  );
}
