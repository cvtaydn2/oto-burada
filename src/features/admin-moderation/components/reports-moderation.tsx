"use client";

import {
  ArrowRight,
  Eye,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useErrorCapture } from "@/features/shared/hooks/use-error-capture";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/ui/components/alert-dialog";
import { Button } from "@/features/ui/components/button";
import { Label } from "@/features/ui/components/label";
import { Textarea } from "@/features/ui/components/textarea";
import { formatDate } from "@/lib";
import { reportReasonLabels, reportStatusLabels } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types";

interface ReportsModerationProps {
  listingMetaById: Record<string, { slug: string; title: string }>;
  reports: Report[];
}

interface PendingReportAction {
  reportId: string;
  status: ReportStatus;
}

const statusClassMap: Record<ReportStatus, string> = {
  dismissed: "bg-muted text-muted-foreground",
  open: "bg-amber-100 text-amber-700",
  resolved: "bg-primary/10 text-primary",
  reviewing: "bg-sky-100 text-sky-700",
};

const actionCopy: Partial<
  Record<ReportStatus, { title: string; description: string; confirmLabel: string; tone: string }>
> = {
  reviewing: {
    title: "Raporu incelemeye al",
    description:
      "Bu durum güncellemesi raporu aktif takip kuyruğuna taşır. Eylem öncesi ilanı ve açıklamayı gözden geçirmen önerilir.",
    confirmLabel: "İncelemeye al",
    tone: "bg-sky-600 text-white hover:bg-sky-700",
  },
  resolved: {
    title: "Raporu çözüldü olarak işaretle",
    description:
      "Bu işlem raporun aksiyona bağlandığını varsayar. Mümkünse moderasyon notu bırakarak audit izini güçlendir.",
    confirmLabel: "Çözüldü olarak kaydet",
    tone: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  dismissed: {
    title: "Raporu kapat",
    description:
      "Bu işlem raporu geçersiz veya sonuçsuz olarak kapatır. Yanlış kapatmayı önlemek için kısa bir not bırakman önerilir.",
    confirmLabel: "Raporu kapat",
    tone: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
};

export function ReportsModeration({ listingMetaById, reports }: ReportsModerationProps) {
  const { captureError } = useErrorCapture("admin-reports-moderation");
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesByReportId, setNotesByReportId] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingReportAction | null>(null);

  if (reports.length === 0) {
    return (
      <section className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm sm:p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          Raporlar
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">İncelenecek rapor yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Kullanıcı raporları geldikçe burada durum değişikliği yapabileceksin.
        </p>
      </section>
    );
  }

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    if (!reportId) return;
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
        const message = payload?.error?.message ?? "Rapor durumu güncellenemedi.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      toast.success("Rapor durumu güncellendi.");
      setNotesByReportId((current) => ({
        ...current,
        [reportId]: "",
      }));
      setPendingAction(null);
      router.refresh();
    } catch (err) {
      captureError(err, "handleStatusUpdate");
      setErrorMessage("Bağlantı sırasında bir hata oluştu.");
      toast.error("Bağlantı sırasında bir hata oluştu.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-border/80 bg-background p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                Raporlar
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Kullanıcı raporları</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Açık ve incelemede olan raporları güvenli durum geçişleri ile yönet, not bırakarak
                denetim izini güçlendir.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-foreground">
                {reports.length} aktif rapor
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <TriangleAlert className="size-3.5" />
                Kapatma işlemleri ek onay ister
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700/80">
                Açık
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {reports.filter((report) => report.status === "open").length}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700/80">
                İncelemede
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {reports.filter((report) => report.status === "reviewing").length}
              </p>
            </div>
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
                ? "Kapora veya sahte ilan riski açısından hızlı önceliklendirme faydalı olabilir."
                : report.reason === "wrong_info"
                  ? "İlandaki veri tutarlılığını fiyat, kilometre ve açıklama bazında kontrol et."
                  : "Tekrar, spam veya diğer güvenlik sinyalleri için açıklamayı gözden geçir.";

            return (
              <article
                key={report.id}
                className="rounded-[1.5rem] border border-border/70 bg-background p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {listingMeta?.title ?? "Bilinmeyen ilan"}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                          <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                            Neden: {reportReasonLabels[report.reason]}
                          </span>
                          <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                            Rapor tarihi: {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
                          statusClassMap[report.status]
                        )}
                      >
                        {reportStatusLabels[report.status]}
                      </span>
                    </div>

                    <div className={cn("rounded-xl border p-4", severityTone)}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="size-4" />
                        Hızlı inceleme notu
                      </div>
                      <p className="mt-2 text-sm leading-6 text-foreground/90">{summary}</p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {report.description?.trim() ? report.description : "Ek açıklama girilmedi."}
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <Label
                        htmlFor={`report-note-${report.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Moderasyon notu
                      </Label>
                      <Textarea
                        id={`report-note-${report.id}`}
                        value={report.id ? (notesByReportId[report.id] ?? "") : ""}
                        onChange={(event) => {
                          if (!report.id) return;
                          const reportId = report.id;
                          setNotesByReportId((current) => ({
                            ...current,
                            [reportId]: event.target.value,
                          }));
                        }}
                        placeholder="Opsiyonel not: neden incelemeye alındı, çözüldü veya kapatıldı?"
                        rows={3}
                        className="mt-2 min-h-24 rounded-xl border-border bg-background"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Not girersen audit kaydına eklenir ve karar bağlamını güçlendirir.
                      </p>
                    </div>

                    {listingMeta ? (
                      <Link
                        href={`/listing/${listingMeta.slug}`}
                        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        <ArrowRight className="size-4" />
                        İlanı aç
                      </Link>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 xl:w-56">
                    <Button
                      type="button"
                      disabled={actionBusy || report.status === "reviewing" || !report.id}
                      onClick={() =>
                        report.id && setPendingAction({ reportId: report.id, status: "reviewing" })
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewing ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                      İncelemeye al
                    </Button>

                    <Button
                      type="button"
                      disabled={actionBusy || report.status === "resolved" || !report.id}
                      onClick={() =>
                        report.id && setPendingAction({ reportId: report.id, status: "resolved" })
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resolved ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                      Çözüldü
                    </Button>

                    <Button
                      type="button"
                      disabled={actionBusy || report.status === "dismissed" || !report.id}
                      onClick={() =>
                        report.id && setPendingAction({ reportId: report.id, status: "dismissed" })
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {dismissed ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      Kapat
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !activeAction) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent className="overflow-hidden rounded-3xl border-border/70 p-0">
          {pendingAction ? (
            <>
              <div className="border-b border-border/70 bg-muted/20 p-6">
                <AlertDialogHeader className="text-left">
                  <AlertDialogTitle>{actionCopy[pendingAction.status]?.title}</AlertDialogTitle>
                  <AlertDialogDescription className="leading-6">
                    {actionCopy[pendingAction.status]?.description}
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Bu güvenlik adımı yanlış durum değişimini azaltır. Karar öncesi rapor açıklamasını
                  ve ilan bağlantısını tekrar doğrulaman önerilir.
                </div>
              </div>

              <AlertDialogFooter className="border-t border-border/70 bg-background px-6 py-4">
                <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn("rounded-xl", actionCopy[pendingAction.status]?.tone)}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleStatusUpdate(pendingAction.reportId, pendingAction.status);
                  }}
                  disabled={activeAction === `${pendingAction.reportId}:${pendingAction.status}`}
                >
                  {activeAction === `${pendingAction.reportId}:${pendingAction.status}` ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {actionCopy[pendingAction.status]?.confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
