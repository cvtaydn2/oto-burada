"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, HelpCircle, MessageSquare, Send, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { answerQuestionAction, askQuestionAction } from "@/app/api/listings/questions/actions";
import {
  getListingQuestions,
  getOwnerListingQuestions,
} from "@/features/marketplace/services/questions";
import { Button } from "@/features/ui/components/button";
import { Textarea } from "@/features/ui/components/textarea";
import { formatDate } from "@/lib";
import { ListingQuestion } from "@/types";

const questionSchema = z.object({
  question: z.string().min(5, "Soru en az 5 karakter olmalıdır").max(1000, "Soru çok uzun"),
});

const answerSchema = z.object({
  answer: z.string().min(2, "Cevap en az 2 karakter olmalıdır").max(2000, "Cevap çok uzun"),
});

interface ListingQuestionsProps {
  listingId: string;
  isOwner: boolean;
  currentUserId?: string;
}

export function ListingQuestions({ listingId, isOwner, currentUserId }: ListingQuestionsProps) {
  const [questions, setQuestions] = useState<ListingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const questionForm = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: "" },
  });

  const answerForm = useForm<z.infer<typeof answerSchema>>({
    resolver: zodResolver(answerSchema),
    defaultValues: { answer: "" },
  });

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isOwner
        ? await getOwnerListingQuestions(listingId)
        : await getListingQuestions(listingId);
      setQuestions(data as ListingQuestion[]);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Sorular yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [listingId, isOwner]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestions();
  }, [fetchQuestions]);

  async function onQuestionSubmit(values: z.infer<typeof questionSchema>) {
    if (!currentUserId) {
      toast.error("Soru sormak için giriş yapmalısınız");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await askQuestionAction(listingId, values.question);
      if (result.success) {
        toast.success("Sorunuz gönderildi. Onaylandıktan sonra yayınlanacaktır.");
        questionForm.reset();
        fetchQuestions();
      } else {
        toast.error(result.error || "Soru gönderilemedi");
      }
    } catch {
      toast.error("Soru gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onAnswerSubmit(values: z.infer<typeof answerSchema>) {
    if (!replyingTo) return;

    setIsSubmitting(true);
    try {
      const result = await answerQuestionAction(replyingTo, values.answer);
      if (result.success) {
        toast.success("Cevabınız yayınlandı");
        setReplyingTo(null);
        answerForm.reset();
        fetchQuestions();
      } else {
        toast.error(result.error || "Cevap gönderilemedi");
      }
    } catch {
      toast.error("Cevap gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-start gap-3 border-b border-border/70 pb-4">
        <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600">
          <MessageSquare className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground">Soru & Cevap</h3>
          <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
            İlanla ilgili merak ettiklerinizi sorun.
          </p>
        </div>
      </div>

      {/* Ask Question Form */}
      {!isOwner && currentUserId && (
        <form
          onSubmit={questionForm.handleSubmit(onQuestionSubmit)}
          className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Satıcıya soru gönder</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Kısa ve net bir soru yazarak araçla ilgili ek bilgi isteyin.
              </p>
            </div>
            <div className="relative">
              <Textarea
                placeholder="İlan sahibine soru sorun..."
                {...questionForm.register("question")}
                className="min-h-[112px] rounded-2xl border-border bg-muted/20 pr-12 text-sm focus:border-indigo-500 resize-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSubmitting}
                className="absolute bottom-3 right-3 size-10 rounded-xl bg-indigo-600 shadow-sm hover:bg-indigo-700"
              >
                <Send className="size-4" />
              </Button>
            </div>
            {questionForm.formState.errors.question && (
              <p className="ml-1 text-[11px] font-semibold text-red-500">
                {questionForm.formState.errors.question.message}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Login Prompt if not logged in */}
      {!isOwner && !currentUserId && (
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-center sm:text-left">
          <p className="text-sm leading-6 text-muted-foreground">
            Soru sormak için{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              giriş yapmalısınız
            </Link>
            .
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4 sm:space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />
            <p className="text-sm font-bold text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchQuestions}
              className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Tekrar Dene
            </Button>
          </div>
        ) : questions.length > 0 ? (
          questions.map((q) => (
            <div
              key={q.id}
              className="animate-in space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm fade-in duration-500 sm:p-5"
            >
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {q.profiles?.full_name || "Gizli Kullanıcı"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(q.created_at)}
                    </span>
                  </div>
                  <p className="break-words text-sm font-medium leading-6 text-foreground">
                    {q.question}
                  </p>

                  {isOwner && q.status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                      <AlertCircle size={10} /> ONAY BEKLİYOR
                    </span>
                  )}
                </div>
              </div>

              {q.answer ? (
                <div className="ml-0 flex gap-3 rounded-2xl border border-indigo-100/60 bg-indigo-50/60 p-4 sm:ml-11">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-500">
                    <User className="size-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Satıcı Cevabı
                      </span>
                    </div>
                    <p className="break-words text-sm leading-6 text-foreground">{q.answer}</p>
                  </div>
                </div>
              ) : isOwner && replyingTo !== q.id ? (
                <div className="ml-0 sm:ml-11">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(q.id)}
                    className="min-h-10 rounded-xl px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    CEVAPLA
                  </Button>
                </div>
              ) : isOwner && replyingTo === q.id ? (
                <form
                  onSubmit={answerForm.handleSubmit(onAnswerSubmit)}
                  className="ml-0 space-y-3 sm:ml-11"
                >
                  <Textarea
                    placeholder="Cevabınızı yazın..."
                    {...answerForm.register("answer")}
                    className="min-h-[96px] rounded-xl border-border bg-muted/20 text-sm resize-none focus:border-indigo-500"
                    autoFocus
                  />
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                      className="min-h-10 rounded-xl px-4 text-xs"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="min-h-10 rounded-xl bg-indigo-600 px-4 text-xs hover:bg-indigo-700"
                    >
                      Gönder
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="text-sm font-bold text-muted-foreground">Henüz soru sorulmamış.</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              İlk soruyu siz sorarak ilan hakkında detaylı bilgi alabilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
