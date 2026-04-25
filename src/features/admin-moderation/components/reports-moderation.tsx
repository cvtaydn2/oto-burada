"use client";

import { ArrowRight, Eye, LoaderCircle, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useErrorCapture } from "@/hooks/use-error-capture";
import { reportReasonLabels, reportStatusLabels } from "@/lib/constants/domain";
import { formatDate } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types";

interface ReportsModerationProps {
  listingMetaById: Record<string, { slug: string; title: string }>;
  reports: Report[];
}

const statusClassMap: Record<ReportStatus, string> = {
  dismissed: "bg-muted text-muted-foreground",
  open: "bg-amber-100 text-amber-700",
  resolved: "bg-primary/10 text-primary",
  reviewing: "bg-sky-100 text-sky-700",
};

export function ReportsModeration({ listingMetaById, reports }: ReportsModerationProps) {
  const { captureError } = useErrorCapture("admin-reports-moderation");
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesByReportId, setNotesByReportId] = useState<Record<string, string>>({});

  if (reports.length === 0) {
    return (
      <section className="rounded-2xl border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Raporlar</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Incelenecek rapor yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Kullanici raporlari geldikce burada durum degisikligi yapabileceksin.
        </p>
      </section>
    );
  }

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    if (!reportId) return; // Guard: never act on reports without a DB ID
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
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message: string };
      } | null;

      if (!response.ok || !payload?.success) {
        toast.error(payload?.error?.message ?? "Rapor durumu güncellenemedi.");
        return;
      }

      toast.success("Rapor durumu güncellendi.");
      setNotesByReportId((current) => ({
        ...current,
        [reportId]: "",
      }));
      router.refresh();
    } catch (err) {
      captureError(err, "handleStatusUpdate");
      toast.error("Bağlantı sırasında bir hata oluştu.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
            Raporlar
          </p>
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
          const listingMeta = listingMetaById[report.listingId];
          const severityTone =
            report.reason === "fake_listing"
              ? "border-amber-100 bg-gradient-to-r from-amber-50 to-background text-amber-700"
              : report.reason === "wrong_info"
                ? "border-primary/10 bg-gradient-to-r from-primary/10 to-background text-primary"
                : "border-border/70 bg-gradient-to-r from-muted/30 to-background text-foreground";
          const summary =
            report.reason === "fake_listing"
              ? "Kapora veya sahte ilan riski acisindan hizli onceliklendirme faydali olabilir."
              : report.reason === "wrong_info"
                ? "Ilandaki veri tutarliligini fiyat, kilometre ve aciklama bazinda kontrol et."
                : "Tekrar, spam veya diger guvenlik sinyalleri icin aciklamayi gozden gecir.";

          return (
            <article
              key={report.id}
              className="rounded-[1.75rem] border border-border/70 bg-background p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {listingMeta?.title ?? "Bilinmeyen ilan"}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[report.status]}`}
                    >
                      {reportStatusLabels[report.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      Neden: {reportReasonLabels[report.reason]}
                    </span>
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      Rapor tarihi: {formatDate(report.createdAt)}
                    </span>
                  </div>

                  <div className={`rounded-xl border p-4 ${severityTone}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="size-4" />
                      Hizli inceleme notu
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground/90">{summary}</p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {report.description?.trim() ? report.description : "Ek aciklama girilmedi."}
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <label
                      htmlFor={`report-note-${report.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Moderasyon notu
                    </label>
                    <textarea
                      id={`report-note-${report.id}`}
                      value={report.id ? (notesByReportId[report.id] ?? "") : ""}
                      onChange={(event) => {
                        if (!report.id) return;
                        setNotesByReportId((current) => ({
                          ...current,
                          [report.id!]: event.target.value,
                        }));
                      }}
                      placeholder="Opsiyonel not: neden incelemeye alindi, cozuldu veya kapatildi?"
                      rows={3}
                      className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Not girersen en az 3 karakter olmali ve audit kaydina eklenir.
                    </p>
                  </div>

                  {listingMeta ? (
                    <Link
                      href={`/listing/${listingMeta.slug}`}
                      className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <ArrowRight className="size-4" />
                      Ilani ac
                    </Link>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:w-44 lg:flex-col">
                  <button
                    type="button"
                    disabled={actionBusy || report.status === "reviewing" || !report.id}
                    onClick={() => report.id && void handleStatusUpdate(report.id, "reviewing")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewing ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    Incelemeye Al
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy || report.status === "resolved" || !report.id}
                    onClick={() => report.id && void handleStatusUpdate(report.id, "resolved")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resolved ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    Cozuldu
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy || report.status === "dismissed" || !report.id}
                    onClick={() => report.id && void handleStatusUpdate(report.id, "dismissed")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {dismissed ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
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
