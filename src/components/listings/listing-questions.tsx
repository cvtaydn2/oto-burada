"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, HelpCircle, MessageSquare, Send, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { answerQuestionAction, askQuestionAction } from "@/app/api/listings/questions/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { getListingQuestions, getOwnerListingQuestions } from "@/services/listings/questions";
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
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
          <MessageSquare className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Soru & Cevap</h3>
          <p className="text-xs text-muted-foreground">İlanla ilgili merak ettiklerinizi sorun.</p>
        </div>
      </div>

      {/* Ask Question Form */}
      {!isOwner && currentUserId && (
        <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-3">
          <div className="relative">
            <Textarea
              placeholder="İlan sahibine soru sorun..."
              {...questionForm.register("question")}
              className="rounded-2xl min-h-[100px] border-border focus:border-indigo-500 resize-none pr-12"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSubmitting}
              className="absolute bottom-3 right-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Send className="size-4" />
            </Button>
          </div>
          {questionForm.formState.errors.question && (
            <p className="text-[10px] font-bold text-red-500 ml-2">
              {questionForm.formState.errors.question.message}
            </p>
          )}
        </form>
      )}

      {/* Login Prompt if not logged in */}
      {!isOwner && !currentUserId && (
        <div className="p-4 rounded-2xl bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            Soru sormak için{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              giriş yapmalısınız
            </Link>
            .
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
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
          <div className="text-center py-8 px-4 rounded-2xl border border-red-200 bg-red-50">
            <AlertCircle className="size-8 text-red-500 mx-auto mb-3" />
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
            <div key={q.id} className="space-y-4 animate-in fade-in duration-500">
              {/* Question */}
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {q.profiles?.full_name || "Gizli Kullanıcı"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(q.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {q.question}
                  </p>

                  {isOwner && q.status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      <AlertCircle size={10} /> ONAY BEKLİYOR
                    </span>
                  )}
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="ml-11 bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 flex gap-3">
                  <div className="size-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                    <User className="size-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Satici Cevabi
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{q.answer}</p>
                  </div>
                </div>
              ) : isOwner && replyingTo !== q.id ? (
                <div className="ml-11">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(q.id)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-0"
                  >
                    CEVAPLA
                  </Button>
                </div>
              ) : isOwner && replyingTo === q.id ? (
                <form
                  onSubmit={answerForm.handleSubmit(onAnswerSubmit)}
                  className="ml-11 space-y-3"
                >
                  <Textarea
                    placeholder="Cevabınızı yazın..."
                    {...answerForm.register("answer")}
                    className="rounded-xl min-h-[80px] border-border focus:border-indigo-500 resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                      className="text-xs"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs rounded-lg"
                    >
                      Gönder
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ))
        ) : (
          <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-border bg-muted/20">
            <MessageSquare className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Henüz soru sorulmamış.</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              İlk soruyu siz sorarak ilan hakkında detaylı bilgi alabilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
