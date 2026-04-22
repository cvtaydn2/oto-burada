"use client";

import { ArrowRight, Filter, History, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { moderationActionLabels } from "@/lib/constants/domain";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AdminModerationAction, ModerationAction } from "@/types";

export interface AdminRecentActionItem {
  action: AdminModerationAction;
  actorLabel: string;
  targetHref?: string | null;
  targetLabel: string;
}

interface AdminRecentActionsProps {
  actions: AdminRecentActionItem[];
}

const targetTypeLabels = {
  listing: "İlan",
  report: "Rapor",
  user: "Kullanıcı",
} as const;

const filters = [
  { label: "Tümü", value: "all" },
  { label: "İlanlar", value: "listing" },
  { label: "Raporlar", value: "report" },
] as const;

const actionFilters: Array<{ label: string; value: ModerationAction | "all" }> = [
  { label: "Tüm Aksiyonlar", value: "all" },
  { label: moderationActionLabels.approve, value: "approve" },
  { label: moderationActionLabels.reject, value: "reject" },
  { label: moderationActionLabels.review, value: "review" },
  { label: moderationActionLabels.resolve, value: "resolve" },
  { label: moderationActionLabels.dismiss, value: "dismiss" },
];

export function AdminRecentActions({ actions }: AdminRecentActionsProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [activeActionFilter, setActiveActionFilter] =
    useState<(typeof actionFilters)[number]["value"]>("all");
  const [query, setQuery] = useState("");

  const filteredActions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return actions.filter((item) => {
      if (activeFilter !== "all" && item.action.targetType !== activeFilter) {
        return false;
      }

      if (activeActionFilter !== "all" && item.action.action !== activeActionFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        item.actorLabel,
        item.targetLabel,
        item.action.note ?? "",
        moderationActionLabels[item.action.action],
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(normalizedQuery);
    });
  }, [actions, activeActionFilter, activeFilter, query]);

  if (actions.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Aksiyon Geçmişi</h2>
            <p className="text-sm text-slate-400 font-medium italic">
              Kayıtlı moderasyon aksiyonu bulunamadı.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Sparkles className="mx-auto size-12 text-slate-100 mb-4" />
          <p className="text-slate-400 font-medium">
            Yeni moderasyon kararları alındıkça burada görünecektir.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-50">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Moderasyon Geçmişi</h2>
            <p className="text-sm text-slate-400 font-medium">
              Son alınan kararlar ve sistem günlüğü
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest">
          {actions.length} KAYIT
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                    isActive
                      ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-2" />

          <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {actionFilters.map((filter) => {
              const isActive = activeActionFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveActionFilter(filter.value)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                    isActive
                      ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            id="admin-action-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Admin, ilan veya notlar içinde ara..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredActions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50">
            <Filter className="mx-auto size-8 text-slate-200 mb-2" />
            <p className="text-sm font-medium text-slate-400">
              Arama kriterlerine uygun sonuç bulunamadı.
            </p>
          </div>
        ) : (
          filteredActions.map((item) => {
            const { action } = item;
            const isApprove = action.action === "approve";
            const isReject = action.action === "reject";

            return (
              <article
                key={action.id ?? `${action.targetType}-${action.targetId}-${action.createdAt}`}
                className="group rounded-2xl border border-slate-100 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                          isApprove
                            ? "bg-emerald-50 text-emerald-600"
                            : isReject
                              ? "bg-rose-50 text-rose-600"
                              : "bg-blue-50 text-blue-600"
                        )}
                      >
                        {moderationActionLabels[action.action]}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        {targetTypeLabels[action.targetType]}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">
                      {formatDate(action.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {item.targetLabel}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      İşlem: <span className="text-slate-600">{item.actorLabel}</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <Sparkles className="size-3" />
                      Yönetici Notu
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-600 font-medium italic">
                      &quot;
                      {action.note?.trim()
                        ? action.note
                        : `${targetTypeLabels[action.targetType]} için moderasyon kararı kaydedildi.`}
                      &quot;
                    </p>
                  </div>

                  {item.targetHref && (
                    <Link
                      href={item.targetHref}
                      className="group/btn flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-slate-100 bg-white text-xs font-bold text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                    >
                      DETAYI GÖRÜNTÜLE
                      <ArrowRight className="size-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
