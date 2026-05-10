import { Search, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QuestionsModeration,
  QuestionWithDetails,
} from "@/features/admin-moderation/components/questions-moderation";
import {
  getAllQuestions,
  getPendingQuestions,
} from "@/features/admin-moderation/services/questions";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Soru Moderasyonu | OtoBurada",
  description:
    "İlanlara gelen kullanıcı sorularını güvenli moderasyon akışıyla inceleyin ve yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/questions"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminQuestionsPageProps {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}

export default async function AdminQuestionsPage({ searchParams }: AdminQuestionsPageProps) {
  await requireAdminUser();
  const { q, page, status = "pending" } = await searchParams;
  const currentPage = Number(page) || 1;
  const limit = 50;
  const offset = (currentPage - 1) * limit;
  const normalizedStatus = status === "all" || status === "pending" ? status : "pending";

  const pendingQuestions = await getPendingQuestions(100);
  const allQuestions = await getAllQuestions(limit, offset);

  return (
    <main className="min-h-full max-w-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                İletişim Denetimi
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Soru <span className="text-amber-600">Moderasyonu</span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                İlanlara gelen soruları mobilde daha okunabilir kartlarla incele, sonra güvenli onay
                akışıyla karar ver.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700/80">
                Bekleyen
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {pendingQuestions.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Görünen sayfa
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {currentPage}
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 sm:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700/80">
                Moderasyon notu
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                Silme ve ret aksiyonları ek onay adımı ile korunur.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/20 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Soru inceleme kuyruğu
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Kullanıcı, ilan ve soru içeriğini tek satırda değerlendir; sonra uygun moderasyon
                kararını ver.
              </p>
            </div>

            <form className="group relative w-full xl:max-w-xl">
              <input type="hidden" name="status" value={status} />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-amber-500"
                size={18}
              />
              <Input
                name="q"
                defaultValue={q}
                className="h-11 rounded-2xl border-border bg-background pl-11 text-sm font-medium transition-all placeholder:text-muted-foreground/70 focus:border-amber-300 focus:ring-4 focus:ring-amber-50"
                placeholder="Soru veya kullanıcı ile ara"
              />
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <ShieldAlert className="size-4 shrink-0" />
            Kalıcı silme ve ret işlemleri yanlış dokunuş riskini azaltmak için ek onay ister.
          </div>
        </div>

        <Tabs value={normalizedStatus} className="w-full">
          <div className="border-b border-border/50 px-4 py-3 sm:px-6">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2">
              <TabsTrigger
                value="pending"
                asChild
                className="h-auto rounded-2xl border border-border/70 px-4 py-3 data-[state=active]:border-amber-300 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-none"
              >
                <Link
                  href={`?status=pending${q ? `&q=${q}` : ""}`}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-semibold">Onay bekleyen</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      Hızlı karar kuyruğu
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-700 hover:bg-amber-100"
                  >
                    {pendingQuestions.length}
                  </Badge>
                </Link>
              </TabsTrigger>

              <TabsTrigger
                value="all"
                asChild
                className="h-auto rounded-2xl border border-border/70 px-4 py-3 data-[state=active]:border-blue-300 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
              >
                <Link
                  href={`?status=all${q ? `&q=${q}` : ""}`}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-semibold">Tüm sorular</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      Geçmiş ve mevcut kayıtlar
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-700 hover:bg-blue-100"
                  >
                    {allQuestions.length}
                  </Badge>
                </Link>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="m-0 bg-muted/10 p-4 sm:p-6">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-64 rounded-3xl border border-border bg-card" />
                  ))}
                </div>
              }
            >
              <QuestionsModeration questions={pendingQuestions as QuestionWithDetails[]} />
            </Suspense>
          </TabsContent>

          <TabsContent value="all" className="m-0 bg-muted/10 p-4 sm:p-6">
            <QuestionsModeration questions={allQuestions as QuestionWithDetails[]} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
