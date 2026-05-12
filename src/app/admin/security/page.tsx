import { AlertTriangle, Ban, Shield, ShieldAlert, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { InfoBlock, MetricCard } from "@/components/admin/security-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface AbuseLog {
  id: string;
  email: string;
  ip_address: string;
  reason: string;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface BannedIP {
  id: string;
  ip_address: string;
  reason: string;
  banned_at: string;
  expires_at: string | null;
}

interface SecurityPageData {
  logs: AbuseLog[];
  bannedIPs: BannedIP[];
  stats: {
    total24h: number;
    reasonCounts: Record<string, number>;
  };
}

export const metadata: Metadata = {
  title: "Admin Güvenlik Operasyonları | OtoBurada",
  description:
    "Abuse logları, yasaklı IP kayıtları ve güvenlik sinyallerini yönetim panelinden izleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/security"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

const REASON_STYLES: Record<string, string> = {
  honeypot: "border-red-200 bg-red-50 text-red-800",
  spam_pattern: "border-orange-200 bg-orange-50 text-orange-800",
  similarity: "border-yellow-200 bg-yellow-50 text-yellow-800",
  rate_limit: "border-blue-200 bg-blue-50 text-blue-800",
  disposable_email: "border-purple-200 bg-purple-50 text-purple-800",
  turnstile_fail: "border-pink-200 bg-pink-50 text-pink-800",
  ip_banned: "border-slate-200 bg-slate-100 text-slate-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getAbuseData(): Promise<SecurityPageData> {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Kritik yapılandırma hatası: SUPABASE_SERVICE_ROLE_KEY eksik. Güvenlik verilerine erişilemiyor."
    );
  }

  const admin = createSupabaseAdminClient();

  const [logsResult, bannedResult, statsResult] = await Promise.all([
    admin
      .from("contact_abuse_log")
      .select("id, email, ip_address, reason, user_agent, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("ip_banlist")
      .select("id, ip_address, reason, banned_at, expires_at")
      .order("banned_at", { ascending: false }),
    admin
      .from("contact_abuse_log")
      .select("reason")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const logs = (logsResult.data || []) as AbuseLog[];
  const bannedIPs = (bannedResult.data || []) as BannedIP[];
  const last24h = statsResult.data || [];

  const reasonCounts = last24h.reduce<Record<string, number>>((acc, log) => {
    acc[log.reason] = (acc[log.reason] || 0) + 1;
    return acc;
  }, {});

  return {
    logs,
    bannedIPs,
    stats: {
      total24h: last24h.length,
      reasonCounts,
    },
  };
}

function getTopReason(stats: SecurityPageData["stats"]) {
  const entries = Object.entries(stats.reasonCounts);
  const sorted = entries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
  return sorted[0] ?? null;
}

export default async function SecurityPage() {
  await requireAdminUser();

  let data: SecurityPageData;

  try {
    data = await getAbuseData();
  } catch (error) {
    logger.security.error("[SecurityPage] Failed to fetch abuse data", error);

    return (
      <div className="min-h-full bg-muted/30 p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-destructive shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                <AlertTriangle className="size-5 sm:size-6" />
                Veri erişim hatası
              </h1>
              <p className="max-w-2xl text-sm leading-6 opacity-90">
                {(error as Error).message ||
                  "Güvenlik verileri alınırken hata oluştu. Lütfen service role yapılandırmasını kontrol edin."}
              </p>
              <p className="text-xs opacity-80">
                Bu yüzey abuse görünürlüğü için admin servis anahtarına bağlıdır. Yapılandırma
                eksikse karar geçmişi ve engelleme aksiyonları görünmez.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/30 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
              asChild
            >
              <Link href="/admin">Panele dön</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { logs, bannedIPs, stats } = data;
  const topReason = getTopReason(stats);
  const blockedAttempts = logs.filter((log) => log.reason !== "success").length;

  return (
    <div className="min-h-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Abuse görünürlüğü
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Güvenlik <span className="text-rose-600">Operasyonları</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium italic text-muted-foreground">
            Contact abuse akışını, IP ban kararlarını ve son 24 saatlik sinyalleri tek yerden
            izleyin.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold">Karar notu</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Ban aksiyonu anlıktır. Kayıtları önce reason, zaman ve tekrar yoğunluğu ile doğrulayın;
            yanlış pozitifleri bu yüzden görünür tuttuk.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          title="Son 24 Saat"
          value={stats.total24h}
          description="Toplam form denemesi"
          icon={TrendingUp}
        />
        <MetricCard
          title="Yasaklı IP"
          value={bannedIPs.length}
          description="Aktif ban kaydı"
          icon={Ban}
        />
        <MetricCard
          title="Bloke Girişim"
          value={blockedAttempts}
          description="Başarısız veya engellenen kayıt"
          icon={ShieldAlert}
        />
        <MetricCard
          title="En Sık Sinyal"
          value={topReason?.[0] ?? "-"}
          description={topReason ? `${topReason[1]} kez görüldü` : "24 saatte sinyal yok"}
          icon={Shield}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle>Yasaklı IP adresleri</CardTitle>
            <CardDescription>
              Form erişimi kapatılmış IP kayıtları. Kalıcı ve süreli banlar burada görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {bannedIPs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                <p className="text-sm font-semibold text-foreground">Henüz yasaklı IP yok.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Şüpheli yoğunluk oluştuğunda ilgili kayıtlar burada audit amaçlı saklanır.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bannedIPs.map((ban) => (
                  <div
                    key={ban.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <p className="break-all font-mono text-sm font-semibold text-foreground">
                          {ban.ip_address}
                        </p>
                        <p className="text-sm text-muted-foreground break-words">{ban.reason}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="text-xs text-muted-foreground">
                          Ban tarihi: {formatDate(ban.banned_at)}
                        </span>
                        {ban.expires_at ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                            Bitiş: {formatDate(ban.expires_at)}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Kalıcı ban</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle>Abuse logları</CardTitle>
            <CardDescription>
              Son 100 kayıt. Başarılı ve engellenen denemeler birlikte gösterilir ki karar bağlamı
              kaybolmasın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                <p className="text-sm font-semibold text-foreground">Henüz abuse kaydı yok.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yeni form hareketleri oluştuğunda log satırları burada görünecek.
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const isSuccessful = log.reason === "success";

                return (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-border"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={cn(
                              "border font-semibold",
                              REASON_STYLES[log.reason] || REASON_STYLES.ip_banned
                            )}
                          >
                            {log.reason}
                          </Badge>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                          <InfoBlock label="IP Adresi" value={log.ip_address} mono />
                          <InfoBlock label="E-posta" value={log.email} />
                          <InfoBlock
                            label="İşlem önerisi"
                            value={
                              isSuccessful ? "İzlemeye devam et" : "Tekrar yoğunluğunu doğrula"
                            }
                          />
                        </div>

                        {log.user_agent && (
                          <div className="rounded-xl bg-muted/30 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                              User agent
                            </p>
                            <p className="mt-1 break-all text-xs leading-5 text-muted-foreground">
                              {log.user_agent}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="w-full lg:w-52 lg:flex-none">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                            Aksiyon
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Sadece başarısız kayıtlar için IP ban formu açılır. Böylece yanlış
                            pozitif riskini azaltırız.
                          </p>

                          {!isSuccessful ? (
                            <form
                              action="/api/admin/security/ban"
                              method="POST"
                              className="mt-3 space-y-2"
                            >
                              <input type="hidden" name="ip" value={log.ip_address} />
                              <input type="hidden" name="reason" value={`Abuse: ${log.reason}`} />
                              <Button
                                type="submit"
                                variant="destructive"
                                className="h-10 w-full rounded-xl text-sm font-semibold"
                              >
                                <Ban className="mr-2 size-4" />
                                IP ban uygula
                              </Button>
                              <p className="text-[11px] text-muted-foreground">
                                Ban sebebi otomatik olarak{" "}
                                <span className="font-medium">Abuse: {log.reason}</span> şeklinde
                                kaydedilir.
                              </p>
                            </form>
                          ) : (
                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                              Başarılı istek. Bu kayıt gözlem amacıyla tutulur, ban aksiyonu
                              gerekmez.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
