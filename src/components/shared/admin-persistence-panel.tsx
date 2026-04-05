import { DatabaseZap, TerminalSquare } from "lucide-react";

import type { PersistenceHealth } from "@/services/admin/persistence-health";

interface AdminPersistencePanelProps {
  health: PersistenceHealth;
}

type StepStatus = "blocked" | "done" | "ready" | "todo";

const statusLabel: Record<StepStatus, string> = {
  blocked: "Bloklu",
  done: "Tamam",
  ready: "Hazir",
  todo: "Sirada",
};

const statusClassName: Record<StepStatus, string> = {
  blocked: "border-destructive/20 bg-destructive/10 text-destructive",
  done: "border-primary/20 bg-primary/10 text-primary",
  ready: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  todo: "border-border/70 bg-muted/40 text-foreground",
};

function formatCommand(command: string) {
  return (
    <code className="block overflow-x-auto rounded-xl border border-border/70 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
      {command}
    </code>
  );
}

export function AdminPersistencePanel({ health }: AdminPersistencePanelProps) {
  const countByKey = Object.fromEntries(health.tables.map((table) => [table.key, table.count]));
  const allBootstrapEnvReady =
    health.environment.adminEnv &&
    health.environment.storageEnv &&
    health.environment.databaseUrlEnv &&
    health.environment.demoPasswordEnv;
  const demoSeedReady =
    (countByKey.profiles ?? 0) >= 4 &&
    (countByKey.listings ?? 0) >= 3 &&
    (countByKey.listing_images ?? 0) >= 9;

  const runbook = [
    {
      command: "npm run db:check-env",
      description:
        "Bootstrap icin gerekli env degerlerini once dogrula. Eksik degisken varsa schema veya seed adimina gecme.",
      status: allBootstrapEnvReady ? "done" : "blocked",
      title: "1. Ortam degiskenlerini kontrol et",
    },
    {
      command: "npm run db:apply-schema",
      description:
        "schema.sql dosyasini hedef Supabase Postgres veritabanina uygula. Bu adim psql ve SUPABASE_DB_URL bekler.",
      status: health.ready ? "done" : health.environment.databaseUrlEnv ? "ready" : "blocked",
      title: "2. Schema'yi uygula",
    },
    {
      command: "npm run db:seed-demo",
      description:
        "Demo auth kullanicilarini, profilleri, ilanlari, gorselleri, favorileri ve raporlari tabloya yaz.",
      status: demoSeedReady ? "done" : health.ready && allBootstrapEnvReady ? "ready" : "todo",
      title: "3. Demo veriyi yukle",
    },
    {
      command: "npm run db:verify-demo",
      description:
        "Seed sonrasi auth kullanicilari, tablo sayilari ve storage bucket erisimini script tarafinda dogrula.",
      status: demoSeedReady && health.storage.bucketAccessible ? "ready" : "todo",
      title: "4. Seed sonucunu dogrula",
    },
    {
      command: "Dashboard > Legacy Sync",
      description:
        "Canli veya test kullanicisinda cookie tabanli eski kayitlar varsa dashboard icindeki Legacy Sync karti ile tabloya tasi.",
      status: health.ready ? "ready" : "todo",
      title: "5. Legacy veriyi backfill et",
    },
  ] satisfies Array<{
    command: string;
    description: string;
    status: StepStatus;
    title: string;
  }>;

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <DatabaseZap className="size-5" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
            Persistence Durumu
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Supabase migration sagligi</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">{health.message}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">Admin env</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {health.environment.adminEnv ? "Hazir" : "Eksik"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">Storage env</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {health.environment.storageEnv ? "Hazir" : "Eksik"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">DB URL env</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {health.environment.databaseUrlEnv ? "Hazir" : "Eksik"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">Demo seed env</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {health.environment.demoPasswordEnv ? "Hazir" : "Eksik"}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">Storage bucket</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {health.storage.bucketAccessible === null
              ? "Kontrol bekliyor"
              : health.storage.bucketAccessible
                ? "Erisilebilir"
                : "Kontrol gerekli"}
          </p>
        </div>
      </div>

      {health.tables.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {health.tables.map((table) => (
            <div
              key={table.key}
              className="rounded-[1.5rem] border border-border/70 bg-background p-5"
            >
              <p className="text-sm text-muted-foreground">{table.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{table.count}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
        <p className="text-sm font-semibold tracking-tight">Storage notu</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{health.storage.message}</p>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-primary/15 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
            <TerminalSquare className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
              Migration Runbook
            </p>
            <h3 className="text-xl font-semibold tracking-tight">
              Gercek Supabase gecisi icin onerilen sira
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Asagidaki adimlar repo icine eklenen scriptleri ve dashboard icindeki legacy sync
              akisini temel alir.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {runbook.map((step) => (
            <div key={step.title} className="rounded-[1.5rem] border border-border/70 bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold tracking-tight">{step.title}</p>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName[step.status]}`}
                >
                  {statusLabel[step.status]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
              <div className="mt-4">{formatCommand(step.command)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
