import { DatabaseZap, ShieldCheck, TerminalSquare, TriangleAlert, Info } from "lucide-react";

import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
import type { PersistenceHealth } from "@/services/admin/persistence-health";
import { cn } from "@/lib/utils";

interface AdminPersistencePanelProps {
  health: PersistenceHealth;
}

type StepStatus = "blocked" | "done" | "ready" | "todo";

const statusLabel: Record<StepStatus, string> = {
  blocked: "Bloklu",
  done: "Tamamlandı",
  ready: "Hazır",
  todo: "Sırada",
};

const statusClasses: Record<StepStatus, string> = {
  blocked: "bg-rose-50 text-rose-600 border-rose-100",
  done: "bg-emerald-50 text-emerald-600 border-emerald-100",
  ready: "bg-blue-50 text-blue-600 border-blue-100",
  todo: "bg-muted/30 text-muted-foreground/70 border-border/50",
};

function formatCommand(command: string) {
  return (
    <code className="block overflow-x-auto rounded-xl border border-border bg-muted/30 px-3 py-2.5 font-mono text-[11px] text-foreground/90 font-bold">
      $ {command}
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
        "Bootstrap için gerekli env değerlerini önce doğrula. Eksik değişken varsa schema veya seed adımına geçme.",
      status: allBootstrapEnvReady ? "done" : "blocked",
      title: "1. Ortam değişkenlerini kontrol et",
    },
    {
      command: "npm run db:apply-schema",
      description:
        "schema.sql dosyasını hedef Supabase Postgres veritabanına uygula. Bu adım psql ve SUPABASE_DB_URL bekler.",
      status: health.ready ? "done" : health.environment.databaseUrlEnv ? "ready" : "blocked",
      title: "2. Schema'yı uygula",
    },
    {
      command: "npm run db:seed-demo",
      description:
        "Demo auth kullanıcılarını, profilleri, ilanları, görselleri, favorileri ve raporları tabloya yaz.",
      status: demoSeedReady ? "done" : health.ready && allBootstrapEnvReady ? "ready" : "todo",
      title: "3. Demo veriyi yükle",
    },
    {
      command: "npm run db:verify-demo",
      description:
        "Seed sonrası auth kullanıcıları, tablo sayıları ve storage bucket erişimini script tarafında doğrula.",
      status: demoSeedReady && health.storage.bucketAccessible ? "ready" : "todo",
      title: "4. Seed sonucunu doğrula",
    },
    {
      command: "Dashboard > Legacy Sync",
      description:
        "Canlı veya test kullanıcısında cookie tabanlı eski kayıtlar varsa dashboard içindeki Legacy Sync kartı ile tabloya taşı.",
      status: health.ready ? "ready" : "todo",
      title: "5. Legacy veriyi backfill et",
    },
  ] satisfies Array<{
    command: string;
    description: string;
    status: StepStatus;
    title: string;
  }>;
  const readyEnvCount = Object.values(health.environment).filter(Boolean).length;
  const accessibleTables = health.tables.filter((table) => table.count >= 0).length;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] items-center">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm shadow-blue-50">
              <DatabaseZap size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Sistem Sağlığı</span>
                 <div className="size-1 rounded-full bg-slate-300" />
                 <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest italic">{formatDate(new Date().toISOString())}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Veri Katmanı Durumu</h2>
              <p className="text-sm text-muted-foreground font-medium max-w-xl">{health.message}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 size-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-colors" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">
              <ShieldCheck className="size-3" />
              Hazırlık Skoru
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-4xl font-bold text-foreground tracking-tighter">
                 {readyEnvCount}
               </span>
               <span className="text-xl font-bold text-muted-foreground/70">/5</span>
            </div>
            <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Erişilebilir Tablo: <span className="text-blue-600 font-bold">{accessibleTables}/{health.tables.length}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <DashboardMetricCard
            label="Admin"
            value={health.environment.adminEnv ? "Aktif" : "Pasif"}
            helper="Service role client"
            icon={ShieldCheck}
            tone={health.environment.adminEnv ? "emerald" : "amber"}
          />
          <DashboardMetricCard
            label="Storage"
            value={health.environment.storageEnv ? "Aktif" : "Pasif"}
            helper="Bucket yetkileri"
            icon={DatabaseZap}
            tone={health.environment.storageEnv ? "emerald" : "amber"}
          />
          <DashboardMetricCard
            label="Postgres"
            value={health.environment.databaseUrlEnv ? "Aktif" : "Pasif"}
            helper="Direct SQL access"
            icon={DatabaseZap}
            tone={health.environment.databaseUrlEnv ? "emerald" : "amber"}
          />
          <DashboardMetricCard
            label="Seed"
            value={health.environment.demoPasswordEnv ? "Hazır" : "Eksik"}
            helper="Demo şifre statüsü"
            icon={ShieldCheck}
            tone={health.environment.demoPasswordEnv ? "emerald" : "amber"}
          />
          <DashboardMetricCard
            label="Bucket"
            value={
              health.storage.bucketAccessible === null
                ? "Bilinmiyor"
                : health.storage.bucketAccessible
                  ? "Erişilebilir"
                  : "Hata"
            }
            helper={health.storage.bucketName ?? "Tanımsız"}
            icon={health.storage.bucketAccessible ? ShieldCheck : TriangleAlert}
            tone={health.storage.bucketAccessible ? "emerald" : "amber"}
          />
        </div>

        {health.tables.length > 0 && (
          <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {health.tables.map((table) => (
              <div
                key={table.key}
                className="rounded-xl border border-border/50 bg-muted/30 p-4 transition-all hover:border-blue-100 hover:bg-card hover:shadow-sm group"
              >
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{table.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground tracking-tight">{table.count}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-blue-50 bg-blue-50/20 p-5 flex items-start gap-3">
          <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
             <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Storage Bilgisi</p>
             <p className="text-sm text-muted-foreground font-medium leading-relaxed">{health.storage.message}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-muted/50 p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card text-blue-600 shadow-sm border border-border">
            <TerminalSquare size={24} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-foreground tracking-tight">Migration Runbook</h3>
            <p className="text-sm text-muted-foreground font-medium">Sistemi sıfırdan kurmak veya güncellemek için izlenecek adımlar</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {runbook.map((step) => (
            <div key={step.title} className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-base font-bold text-foreground">{step.title}</p>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                  statusClasses[step.status]
                )}>
                  {statusLabel[step.status]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">{step.description}</p>
              <div className="mt-auto">{formatCommand(step.command)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
