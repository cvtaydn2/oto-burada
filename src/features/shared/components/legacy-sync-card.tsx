"use client";

import { ArrowRight, ClipboardList, DatabaseZap, LoaderCircle, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/features/ui/components/button";

interface LegacySyncCardProps {
  legacyListingsCount: number;
  legacyReportsCount: number;
}

interface SyncState {
  message?: string;
  status: "error" | "idle" | "success";
}

export function LegacySyncCard({ legacyListingsCount, legacyReportsCount }: LegacySyncCardProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" });
  const totalLegacyCount = legacyListingsCount + legacyReportsCount;

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncState({ status: "idle" });

    try {
      const response = await fetch("/api/migrations/legacy-sync", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setSyncState({
          message: payload?.message ?? "Legacy veri tasinamadi.",
          status: "error",
        });
        return;
      }

      setSyncState({
        message: payload?.message ?? "Legacy veri Supabase tarafina tasindi.",
        status: "success",
      });
      router.refresh();
    } catch {
      setSyncState({
        message: "Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.",
        status: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="rounded-2xl border border-primary/15 bg-primary/5 p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
            <DatabaseZap className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
              Legacy Sync
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Tarayicidaki eski kayitlari Supabase&apos;e tasi
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Bu cihazda kalan {legacyListingsCount} ilan ve {legacyReportsCount} rapor kaydini yeni
              tablo yapisina tek tikla tasiyabilirsin.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Hazir veri
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {totalLegacyCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Eski cookie kayitlari taranir, Supabase&apos;e yazilir ve basarili senkron sonrasi
            temizlenir.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardList className="size-4 text-primary" />
            Legacy ilan
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {legacyListingsCount}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TriangleAlert className="size-4 text-primary" />
            Legacy rapor
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {legacyReportsCount}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ArrowRight className="size-4 text-primary" />
            Beklenen sonuc
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
            Dashboard ve admin ekranlari artik ayni veriyi tablolar uzerinden okuyacak.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {[
          "Tarayicidaki cookie kayitlari taranir.",
          "Eksik ilan ve raporlar Supabase tablolarina yazilir.",
          "Basarili aktarim sonrasi legacy kayitlar temizlenir.",
        ].map((step, index) => (
          <div key={step} className="rounded-xl border border-border/70 bg-background px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Adim {index + 1}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          disabled={isSyncing}
          onClick={() => void handleSync()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSyncing ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <DatabaseZap className="size-4" />
          )}
          {isSyncing ? "Senkronize ediliyor..." : "Supabase'e tasi"}
        </Button>

        {syncState.message ? (
          <p
            className={
              syncState.status === "error" ? "text-sm text-destructive" : "text-sm text-primary"
            }
          >
            {syncState.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
