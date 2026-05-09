"use client";

import {
  Car,
  Check,
  LoaderCircle,
  MessageCircle,
  Trash2,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  approveQuestionAction,
  deleteQuestionAction,
  rejectQuestionAction,
} from "@/app/admin/questions/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/datetime/date-utils";
import { cn } from "@/lib/utils";

export interface QuestionWithDetails {
  id: string;
  listing_id: string;
  user_id: string;
  question: string;
  answer?: string;
  status: string;
  is_public: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    email?: string;
  };
  listings: {
    title: string;
    slug: string;
  };
}

interface QuestionsModerationProps {
  questions: QuestionWithDetails[];
}

type QuestionActionType = "approve" | "reject" | "delete";

interface PendingQuestionAction {
  id: string;
  type: QuestionActionType;
}

const actionCopy: Record<
  QuestionActionType,
  { title: string; description: string; confirmLabel: string; tone: string }
> = {
  approve: {
    title: "Soruyu onayla",
    description:
      "Bu işlem soruyu yayına alır. İçeriğin güvenli ve ilana uygun olduğundan emin olduktan sonra onay ver.",
    confirmLabel: "Onayla",
    tone: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  reject: {
    title: "Soruyu reddet",
    description:
      "Bu işlem soruyu görünmez hale getirir. Spam, uygunsuz içerik veya ilan dışı mesajlarda kullanılmalıdır.",
    confirmLabel: "Reddet",
    tone: "bg-amber-500 text-white hover:bg-amber-600",
  },
  delete: {
    title: "Soruyu kalıcı olarak sil",
    description:
      "Bu işlem geri alınamaz. Sadece açıkça kötüye kullanım veya sistem temizliği gereken durumlarda kullanılmalıdır.",
    confirmLabel: "Kalıcı olarak sil",
    tone: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
};

export function QuestionsModeration({ questions }: QuestionsModerationProps) {
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingQuestionAction | null>(null);

  const handleAction = async (
    id: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ) => {
    setLoadingIds((prev) => [...prev, id]);
    try {
      const result = await action();
      if (result.success) {
        toast.success(successMsg);
        setPendingAction(null);
      } else {
        toast.error(result.error || "Bir hata oluştu");
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setLoadingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-10 text-center sm:p-12">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <MessageCircle className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Onay bekleyen soru yok</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Şu anda moderasyon bekleyen herhangi bir ilan sorusu bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {questions.map((question) => {
          const loading = loadingIds.includes(question.id);

          return (
            <Card
              key={question.id}
              className="flex flex-col overflow-hidden rounded-3xl border-border/70 shadow-sm transition-all hover:border-amber-200"
            >
              <CardHeader className="border-b border-border/50 bg-muted/20 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <User className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {question.profiles?.full_name || "Bilinmeyen Kullanıcı"}
                      </span>
                      <span className="block truncate text-[11px] font-medium text-muted-foreground">
                        {question.profiles?.email ?? "E-posta gizli"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700"
                    >
                      {question.status === "pending" ? "Onay bekliyor" : question.status}
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDate(question.created_at)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-5 p-4 sm:p-5">
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                    Soru içeriği
                  </span>
                  <p className="mt-2 text-sm font-semibold leading-7 text-foreground sm:text-base">
                    “{question.question}”
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/60 p-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Car className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                      İlgili ilan
                    </span>
                    <Link
                      href={`/listing/${question.listings?.slug}`}
                      target="_blank"
                      className="truncate text-sm font-semibold text-foreground transition-colors hover:text-blue-600"
                    >
                      {question.listings?.title}
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Kritik aksiyonlarda yanlış dokunuş riskini azaltmak için onay adımı gösterilir.
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 border-t border-border/50 p-4 sm:flex-row sm:p-5">
                <Button
                  className="h-11 flex-1 gap-2 rounded-2xl bg-emerald-600 font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                  onClick={() => setPendingAction({ id: question.id, type: "approve" })}
                  disabled={loading}
                >
                  {loading &&
                  pendingAction?.id === question.id &&
                  pendingAction.type === "approve" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Onayla
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1 gap-2 rounded-2xl border-amber-200 font-bold text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  onClick={() => setPendingAction({ id: question.id, type: "reject" })}
                  disabled={loading}
                >
                  {loading &&
                  pendingAction?.id === question.id &&
                  pendingAction.type === "reject" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <X size={18} />
                  )}
                  Reddet
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 rounded-2xl px-4 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 sm:w-auto"
                  onClick={() => setPendingAction({ id: question.id, type: "delete" })}
                  disabled={loading}
                >
                  <Trash2 size={18} />
                  <span className="sm:hidden">Kalıcı sil</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && loadingIds.length === 0) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent className="overflow-hidden rounded-3xl border-border/70 p-0">
          {pendingAction ? (
            <>
              <div className="border-b border-border/70 bg-muted/20 p-6">
                <AlertDialogHeader className="text-left">
                  <AlertDialogTitle>{actionCopy[pendingAction.type].title}</AlertDialogTitle>
                  <AlertDialogDescription className="leading-6">
                    {actionCopy[pendingAction.type].description}
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  Özellikle kalıcı silme işleminden önce soru içeriğini ve bağlı ilanı tekrar
                  kontrol et.
                </div>
              </div>

              <AlertDialogFooter className="border-t border-border/70 bg-background px-6 py-4">
                <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn("rounded-xl", actionCopy[pendingAction.type].tone)}
                  onClick={(event) => {
                    event.preventDefault();

                    if (pendingAction.type === "approve") {
                      void handleAction(
                        pendingAction.id,
                        () => approveQuestionAction(pendingAction.id),
                        "Soru onaylandı ve yayına alındı."
                      );
                      return;
                    }

                    if (pendingAction.type === "reject") {
                      void handleAction(
                        pendingAction.id,
                        () => rejectQuestionAction(pendingAction.id),
                        "Soru reddedildi."
                      );
                      return;
                    }

                    void handleAction(
                      pendingAction.id,
                      () => deleteQuestionAction(pendingAction.id),
                      "Soru kalıcı olarak silindi."
                    );
                  }}
                  disabled={loadingIds.includes(pendingAction.id)}
                >
                  {loadingIds.includes(pendingAction.id) ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {actionCopy[pendingAction.type].confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
