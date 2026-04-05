"use client";

import { DatabaseZap, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LegacySyncCardProps {
  legacyListingsCount: number;
  legacyReportsCount: number;
}

interface SyncState {
  message?: string;
  status: "error" | "idle" | "success";
}

export function LegacySyncCard({
  legacyListingsCount,
  legacyReportsCount,
}: LegacySyncCardProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" });

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
    <section className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 shadow-sm sm:p-8">
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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={isSyncing}
          onClick={() => void handleSync()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSyncing ? <LoaderCircle className="size-4 animate-spin" /> : <DatabaseZap className="size-4" />}
          {isSyncing ? "Senkronize ediliyor..." : "Supabase&apos;e tasi"}
        </button>

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
