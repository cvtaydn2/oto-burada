import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { createSupabaseAdminClient } from "@/lib/admin";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

interface AdminActionWithProfile {
  id: string;
  action: string;
  admin_user_id: string;
  target_id: string;
  target_type: string;
  note: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Audit Kayıtları | OtoBurada",
  description:
    "Admin işlemlerinin zaman, hedef ve açıklama bağlamıyla izlendiği audit kayıtlarını inceleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/audit"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminUser();
  const { q, page } = await searchParams;
  const currentPage = Number(page) || 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const supabase = createSupabaseAdminClient();

  let baseQuery = supabase.from("admin_actions").select(
    `
      id,
      action,
      admin_user_id,
      target_id,
      target_type,
      note,
      created_at,
      profiles!admin_actions_admin_user_id_fkey(full_name)
    `,
    { count: "exact" }
  );

  if (q) {
    baseQuery = baseQuery.or(`action.ilike.%${q}%,note.ilike.%${q}%`);
  }

  const [{ data: actions, count }] = await Promise.all([
    baseQuery.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
  ]);

  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  function getTargetHref(action: AdminActionWithProfile): string | null {
    if (action.target_type === "listing") return `/admin/listings?q=${action.target_id}`;
    if (action.target_type === "user") return `/admin/users/${action.target_id}`;
    if (action.target_type === "report") return "/admin/reports";
    return null;
  }

  return (
    <div className="min-h-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-muted shadow-[0_0_8px_rgba(100,116,139,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Şeffaflık ve Güvenlik
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Denetim <span className="text-muted-foreground">Kayıtları</span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Admin işlemlerini zaman, hedef ve açıklama bağlamıyla takip ederek karar zincirini
                doğrula.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Toplam kayıt
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalItems}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700/80">
                Sayfa
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {currentPage}
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700/80">
                Audit ipucu
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                Not içeren kayıtlar karar bağlamını daha hızlı açıklar.
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
                İşlem günlüğü
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Arama ile eylem ya da not süz, ardından hedef kaynağa giderek bağlamı derinleştir.
              </p>
            </div>

            <form className="group relative w-full xl:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-blue-500"
                size={18}
              />
              <Input
                name="q"
                defaultValue={q}
                className="h-11 rounded-2xl border-border bg-background pl-11 pr-4 text-sm font-medium transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                placeholder="İşlem veya not ara"
              />
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <TriangleAlert className="size-4 shrink-0" />
            Audit okumada önce notu olan kayıtları, sonra hedef bağlantısını kontrol etmek daha
            hızlı doğrulama sağlar.
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:hidden">
          {actions?.length ? (
            actions.map((action) => {
              const href = getTargetHref(action);

              return (
                <article
                  key={action.id}
                  className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                        <ShieldCheck size={18} className="text-muted-foreground/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {action.profiles?.full_name || "Bilinmeyen Admin"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(action.created_at).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] border-none",
                        action.action === "approve"
                          ? "bg-emerald-100 text-emerald-700"
                          : action.action === "reject"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {action.action}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                        Hedef nesne
                      </p>
                      {href ? (
                        <Link
                          href={href}
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-blue-600"
                        >
                          <span>{action.target_type}</span>
                          <span className="font-mono text-xs">
                            #{action.target_id.substring(0, 8)}...
                          </span>
                          <ExternalLink size={14} />
                        </Link>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {action.target_type}{" "}
                          <span className="font-mono text-xs">
                            #{action.target_id.substring(0, 8)}...
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                        Açıklama
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {action.note || "Ek not belirtilmedi."}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-border bg-muted/30">
                  <History className="text-slate-300" size={28} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  Henüz bir eylem kaydı bulunmuyor
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Zamanlama
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Admin / Operatör
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Eylem
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Hedef Nesne
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Açıklama
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background">
              {actions?.map((action) => {
                const href = getTargetHref(action);

                return (
                  <tr key={action.id} className="group transition-colors hover:bg-blue-50/20">
                    <td className="whitespace-nowrap px-6 py-5 text-xs font-bold italic text-muted-foreground/70">
                      {new Date(action.created_at).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-muted transition-all group-hover:bg-card">
                          <ShieldCheck
                            size={16}
                            className="text-muted-foreground/70 group-hover:text-blue-600"
                          />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tight text-foreground">
                          {action.profiles?.full_name || "Bilinmeyen Admin"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] border-none",
                          action.action === "approve"
                            ? "bg-emerald-100 text-emerald-700"
                            : action.action === "reject"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {action.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 font-mono text-[11px] text-muted-foreground/70">
                      {href ? (
                        <Link
                          href={href}
                          className="flex items-center gap-2 transition-colors hover:text-blue-600 group-hover:text-blue-600"
                        >
                          <span className="font-bold">{action.target_type}</span>
                          <span>#{action.target_id.substring(0, 8)}...</span>
                          <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{action.target_type}</span>
                          <span>#{action.target_id.substring(0, 8)}...</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                        {action.note || "Ek not belirtilmedi."}
                      </p>
                    </td>
                  </tr>
                );
              })}

              {!actions?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-border bg-muted/30">
                        <History className="text-slate-300" size={28} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                        Henüz bir eylem kaydı bulunmuyor
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-xs font-bold text-muted-foreground">
              Toplam {totalItems} kayıt, sayfa {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild
                className="h-9 rounded-xl border-border font-bold"
              >
                {currentPage <= 1 ? (
                  <span>
                    <ChevronLeft size={16} className="mr-1" />
                    Önceki
                  </span>
                ) : (
                  <Link
                    href={`?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      page: String(currentPage - 1),
                    }).toString()}`}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Önceki
                  </Link>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild
                className="h-9 rounded-xl border-border font-bold"
              >
                {currentPage >= totalPages ? (
                  <span>
                    Sonraki
                    <ChevronRight size={16} className="ml-1" />
                  </span>
                ) : (
                  <Link
                    href={`?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      page: String(currentPage + 1),
                    }).toString()}`}
                  >
                    Sonraki
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
