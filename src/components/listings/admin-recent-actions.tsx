import { moderationActionLabels } from "@/lib/constants/domain";
import { formatDate } from "@/lib/utils";
import type { AdminModerationAction } from "@/types";

interface AdminRecentActionsProps {
  actions: AdminModerationAction[];
}

const targetTypeLabels = {
  listing: "Ilan",
  report: "Rapor",
} as const;

export function AdminRecentActions({ actions }: AdminRecentActionsProps) {
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

      <div className="mt-6 grid gap-4">
        {actions.map((action) => (
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
        ))}
      </div>
    </section>
  );
}
