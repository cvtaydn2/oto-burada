import { Search } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QuestionsModeration,
  QuestionWithDetails,
} from "@/features/admin-moderation/components/questions-moderation";
import { requireAdminUser } from "@/lib/auth/session";
import { getAllQuestions, getPendingQuestions } from "@/services/admin/questions";

export const dynamic = "force-dynamic";

interface AdminQuestionsPageProps {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}

export default async function AdminQuestionsPage({ searchParams }: AdminQuestionsPageProps) {
  await requireAdminUser();
  const { q, page, status = "pending" } = await searchParams;
  const currentPage = Number(page) || 1;
  const limit = 50;
  const offset = (currentPage - 1) * limit;

  // Parallel fetch counts and main list
  const pendingQuestions = await getPendingQuestions(100);
  const allQuestions = await getAllQuestions(limit, offset);

  return (
    <main className="space-y-8 p-6 lg:p-8 max-w-full bg-muted/30 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] italic">
              İletişim Denetimi
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Soru <span className="text-amber-600">Moderasyonu</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground font-medium italic">
            İlanlara gelen soruları inceleyin, onaylayın veya engelleyin.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between gap-4">
          <form className="relative flex-1 max-w-xl group">
            <input type="hidden" name="status" value={status} />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-amber-500 transition-colors"
              size={18}
            />
            <Input
              name="q"
              defaultValue={q}
              className="pl-12 h-12 bg-card border-border focus:border-amber-300 focus:ring-4 focus:ring-amber-50 rounded-xl font-medium placeholder:italic placeholder:text-slate-300 transition-all"
              placeholder="Soru veya kullanıcı ile ara..."
            />
          </form>
        </div>

        <Tabs defaultValue={status} className="w-full">
          <div className="px-6 border-b border-border/50 bg-card overflow-x-auto">
            <TabsList className="h-20 bg-transparent gap-10 p-0 flex">
              <TabsTrigger
                value="pending"
                asChild
                className="h-20 rounded-none border-b-4 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold uppercase tracking-widest text-[11px] gap-3 transition-all data-[state=active]:text-amber-600"
              >
                <a href={`?status=pending${q ? `&q=${q}` : ""}`}>
                  Onay Bekleyen
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-lg px-2 py-0.5 font-bold"
                  >
                    {pendingQuestions.length}
                  </Badge>
                </a>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                asChild
                className="h-20 rounded-none border-b-4 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold uppercase tracking-widest text-[11px] gap-3 transition-all data-[state=active]:text-amber-600"
              >
                <a href={`?status=all${q ? `&q=${q}` : ""}`}>Tüm Sorular</a>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="m-0 p-8 bg-muted/20">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-64 bg-card rounded-3xl border border-border" />
                  ))}
                </div>
              }
            >
              <QuestionsModeration questions={pendingQuestions as QuestionWithDetails[]} />
            </Suspense>
          </TabsContent>

          <TabsContent value="all" className="m-0 p-8 bg-muted/20">
            {/* We can reuse QuestionsModeration or create a table for all questions */}
            <QuestionsModeration questions={allQuestions as QuestionWithDetails[]} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
