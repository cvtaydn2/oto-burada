"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { moderationActionLabels } from "@/lib/constants/domain";
import { formatDate } from "@/lib/utils";
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
  listing: "Ilan",
  report: "Rapor",
} as const;

const filters = [
  { label: "Tumu", value: "all" },
  { label: "Ilan", value: "listing" },
  { label: "Rapor", value: "report" },
] as const;

const actionFilters: Array<{ label: string; value: ModerationAction | "all" }> = [
  { label: "Tum aksiyonlar", value: "all" },
  { label: moderationActionLabels.approve, value: "approve" },
  { label: moderationActionLabels.reject, value: "reject" },
  { label: moderationActionLabels.review, value: "review" },
  { label: moderationActionLabels.resolve, value: "resolve" },
  { label: moderationActionLabels.dismiss, value: "dismiss" },
];

export function AdminRecentActions({ actions }: AdminRecentActionsProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [activeActionFilter, setActiveActionFilter] = useState<(typeof actionFilters)[number]["value"]>("all");
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
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          Aksiyon Gecmisi
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Kayitli moderasyon aksiyonu yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Supabase tablolari uzerinden yeni moderasyon kararlari geldikce burada audit trail olusacak.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
            Aksiyon Gecmisi
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Son moderasyon kararlari</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Admin panelinde verilen son kararlar burada zaman damgasi ile tutulur.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          {actions.length} kayit
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={
                isActive
                  ? "inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  : "inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actionFilters.map((filter) => {
          const isActive = activeActionFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveActionFilter(filter.value)}
              className={
                isActive
                  ? "inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  : "inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label htmlFor="admin-action-search" className="sr-only">
          Aksiyon gecmisi icinde ara
        </label>
        <input
          id="admin-action-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Admin, ilan, rapor veya not icinde ara"
          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      {filteredActions.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
          Secili filtrelerle eslesen aksiyon kaydi bulunamadi.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {filteredActions.map((item) => {
          const { action } = item;

          return (
            <article
              key={action.id ?? `${action.targetType}-${action.targetId}-${action.createdAt}`}
              className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {moderationActionLabels[action.action]}
                    </span>
                    <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {targetTypeLabels[action.targetType]}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {item.targetLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">Islemi yapan: {item.actorLabel}</p>
                    {item.targetHref ? (
                      <Link
                        href={item.targetHref}
                        className="inline-flex text-sm font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        Ilgili ilana git
                      </Link>
                    ) : null}
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {action.note?.trim()
                      ? action.note
                      : `${targetTypeLabels[action.targetType]} icin moderasyon karari kaydedildi.`}
                  </p>
                </div>

                <div className="rounded-2xl bg-background px-4 py-3 text-sm font-medium text-foreground">
                  {formatDate(action.createdAt)}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
