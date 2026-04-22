"use client";

import Link from "next/link";
import { Bell, ChevronRight, LoaderCircle, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { formatDate } from "@/lib/utils";
import { captureClientEvent } from "@/lib/monitoring/posthog-client";

interface SavedSearchListItem {
  filtersSummary: string;
  href: string;
  id: string;
  notificationsEnabled: boolean;
  resultCount: number;
  title: string;
  updatedAt: string;
}

interface SavedSearchesPanelProps {
  initialSavedSearches: SavedSearchListItem[];
}

export function SavedSearchesPanel({ initialSavedSearches }: SavedSearchesPanelProps) {
  const [savedSearches, setSavedSearches] = useState(initialSavedSearches);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleNotifications = async (searchId: string, nextValue: boolean) => {
    setActiveAction(`toggle:${searchId}`);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationsEnabled: nextValue }),
      });
      const payload = await response.json().catch(() => null) as { success?: boolean; error?: { message?: string } } | null;

      if (!response.ok || !payload?.success) {
        const message = payload?.error?.message ?? "Kayıtlı arama güncellenemedi.";
        captureClientEvent("saved_search_toggle_failed", { searchId, nextValue, responseStatus: response.status, message });
        setErrorMessage(message);
        return;
      }

      setSavedSearches((current) =>
        current.map((search) =>
          search.id === searchId
            ? { ...search, notificationsEnabled: nextValue }
            : search,
          ),
      );
      captureClientEvent("saved_search_toggled", { searchId, notificationsEnabled: nextValue });
    } catch {
      captureClientEvent("saved_search_toggle_failed", { searchId, nextValue, message: "Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene." });
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async (searchId: string) => {
    setActiveAction(`delete:${searchId}`);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null) as { success?: boolean; error?: { message?: string } } | null;

      if (!response.ok || !payload?.success) {
        const message = payload?.error?.message ?? "Kayitli arama silinemedi.";
        captureClientEvent("saved_search_delete_failed", { searchId, responseStatus: response.status, message });
        setErrorMessage(message);
        return;
      }

      setSavedSearches((current) => current.filter((search) => search.id !== searchId));
      captureClientEvent("saved_search_deleted", { searchId });
    } catch {
      captureClientEvent("saved_search_delete_failed", { searchId, message: "Baglanti sirasinda bir hata olustu. Lutfen tekrar dene." });
      setErrorMessage("Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  if (savedSearches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Search size={32} />
        </div>
        <h3 className="text-xl font-bold text-foreground">Kayitli arama yok</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Listings sayfasinda filtrelerini ayarlayip &quot;Aramayi Kaydet&quot; butonuna tikladiginda
          burada tekrar ulasabilecegin bir arama olusur.
        </p>
        <Link
          href="/listings"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ilanlari incele
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {savedSearches.map((search) => {
        const toggling = activeAction === `toggle:${search.id}`;
        const deleting = activeAction === `delete:${search.id}`;

        return (
          <div
            key={search.id}
            className="group flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Search className="size-5" />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-foreground">{search.title}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                    {search.resultCount} aktif ilan
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{search.filtersSummary}</p>
                <p className="mt-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40">
                  Son güncelleme: {formatDate(search.updatedAt)}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <button
                type="button"
                onClick={() => void handleToggleNotifications(search.id, !search.notificationsEnabled)}
                disabled={toggling || deleting}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {toggling ? <LoaderCircle className="size-4 animate-spin" /> : <Bell className="size-4" />}
                {search.notificationsEnabled ? "Bildirimler Acik" : "Bildirimleri Ac"}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(search.id)}
                disabled={toggling || deleting}
                className="flex size-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                title="Sil"
              >
                {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-5" />}
              </button>
              <Link
                href={search.href}
                className="flex size-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                title="Aramaya Git"
              >
                <ChevronRight className="size-5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
