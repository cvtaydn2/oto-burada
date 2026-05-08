"use client";

import { Car, Check, MessageCircle, Trash2, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  approveQuestionAction,
  deleteQuestionAction,
  rejectQuestionAction,
} from "@/app/admin/questions/actions";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/features/ui/components/card";
import { formatDate } from "@/lib";

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

export function QuestionsModeration({ questions }: QuestionsModerationProps) {
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

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
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-3xl border border-dashed border-border text-center">
        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="text-muted-foreground size-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Onay Bekleyen Soru Yok</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Şu anda moderasyon bekleyen herhangi bir ilan sorusu bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {questions.map((q) => (
        <Card
          key={q.id}
          className="rounded-3xl border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
        >
          <CardHeader className="p-6 bg-muted/30 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className="rounded-lg bg-amber-50 text-amber-700 border-amber-200 font-bold uppercase text-[10px] tracking-widest px-2 py-1"
              >
                ONAY BEKLIYOR
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {formatDate(q.created_at)}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <User className="text-primary size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">
                  {q.profiles?.full_name || "Bilinmeyen Kullanıcı"}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium truncate">
                  {q.profiles?.email ?? "E-posta gizli"}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex-1 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic">
                Soru
              </span>
              <p className="text-base font-semibold text-foreground leading-relaxed italic">
                &quot;{q.question}&quot;
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Car className="text-blue-600 size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">
                  İlgili İlan
                </span>
                <Link
                  href={`/listing/${q.listings?.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-foreground hover:text-blue-600 transition-colors truncate"
                >
                  {q.listings?.title}
                </Link>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 flex gap-3">
            <Button
              className="flex-1 rounded-2xl h-12 gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              onClick={() =>
                handleAction(
                  q.id,
                  () => approveQuestionAction(q.id),
                  "Soru onaylandı ve yayına alındı."
                )
              }
              disabled={loadingIds.includes(q.id)}
            >
              <Check size={18} />
              Onayla
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-2xl h-12 gap-2 font-bold border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() =>
                handleAction(q.id, () => rejectQuestionAction(q.id), "Soru reddedildi.")
              }
              disabled={loadingIds.includes(q.id)}
            >
              <X size={18} />
              Reddet
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl h-12 w-12 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm("Bu soruyu tamamen silmek istediğinize emin misiniz?")) {
                  handleAction(
                    q.id,
                    () => deleteQuestionAction(q.id),
                    "Soru kalıcı olarak silindi."
                  );
                }
              }}
              disabled={loadingIds.includes(q.id)}
            >
              <Trash2 size={18} />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
