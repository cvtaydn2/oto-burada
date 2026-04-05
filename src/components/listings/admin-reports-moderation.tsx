"use client";

import { useRouter } from "next/navigation";
import { Eye, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";

import { reportReasonLabels, reportStatusLabels } from "@/lib/constants/domain";
import { formatDate } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types";

interface AdminReportsModerationProps {
  listingTitleById: Record<string, string>;
  reports: Report[];
}

const statusClassMap: Record<ReportStatus, string> = {
  dismissed: "bg-muted text-muted-foreground",
  open: "bg-amber-100 text-amber-700",
  resolved: "bg-primary/10 text-primary",
  reviewing: "bg-sky-100 text-sky-700",
};

export function AdminReportsModeration({
  listingTitleById,
  reports,
}: AdminReportsModerationProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesByReportId, setNotesByReportId] = useState<Record<string, string>>({});

  if (reports.length === 0) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Raporlar</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Incelenecek rapor yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Kullanici raporlari geldikce burada durum degisikligi yapabileceksin.
        </p>
      </section>
    );
  }

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    setActiveAction(`${reportId}:${status}`);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        body: JSON.stringify({
          note: notesByReportId[reportId]?.trim() || undefined,
          status,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Rapor durumu guncellenemedi.");
        return;
      }

      setNotesByReportId((current) => ({
        ...current,
        [reportId]: "",
      }));
      router.refresh();
    } catch {
      setErrorMessage("Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Raporlar</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Kullanici raporlari</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Acik ve incelemede olan raporlari durum guncelleyerek yonetebilirsin.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          {reports.length} rapor
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {reports.map((report) => {
          const reviewing = activeAction === `${report.id}:reviewing`;
          const resolved = activeAction === `${report.id}:resolved`;
          const dismissed = activeAction === `${report.id}:dismissed`;
          const actionBusy = reviewing || resolved || dismissed;

          return (
            <article
              key={report.id}
              className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {listingTitleById[report.listingId] ?? "Bilinmeyen ilan"}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[report.status]}`}
                    >
                      {reportStatusLabels[report.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                    <span className="rounded-full bg-background px-3 py-1.5">
                      Neden: {reportReasonLabels[report.reason]}
                    </span>
                    <span className="rounded-full bg-background px-3 py-1.5">
                      Rapor tarihi: {formatDate(report.createdAt)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {report.description?.trim() ? report.description : "Ek aciklama girilmedi."}
                  </div>

                  <div className="rounded-2xl bg-background px-4 py-3">
                    <label
                      htmlFor={`report-note-${report.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Moderasyon notu
                    </label>
                    <textarea
                      id={`report-note-${report.id}`}
                      value={notesByReportId[report.id ?? ""] ?? ""}
                      onChange={(event) =>
                        setNotesByReportId((current) => ({
                          ...current,
                          [report.id ?? ""]: event.target.value,
                        }))
                      }
                      placeholder="Opsiyonel not: neden incelemeye alindi, cozuldu veya kapatildi?"
                      rows={3}
                      className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Not girersen en az 3 karakter olmali ve audit kaydina eklenir.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    disabled={actionBusy || report.status === "reviewing"}
                    onClick={() => void handleStatusUpdate(report.id ?? "", "reviewing")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewing ? <LoaderCircle className="size-4 animate-spin" /> : <Eye className="size-4" />}
                    Incelemeye Al
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy || report.status === "resolved"}
                    onClick={() => void handleStatusUpdate(report.id ?? "", "resolved")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resolved ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Cozuldu
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy || report.status === "dismissed"}
                    onClick={() => void handleStatusUpdate(report.id ?? "", "dismissed")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {dismissed ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                    Kapat
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
