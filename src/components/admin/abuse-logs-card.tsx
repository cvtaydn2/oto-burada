import { Ban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function InfoBlock({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-all text-sm font-medium text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface AbuseLogsCardProps {
  logs: AbuseLog[];
}

export function AbuseLogsCard({ logs }: AbuseLogsCardProps) {
  return (
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
                        value={isSuccessful ? "İzlemeye devam et" : "Tekrar yoğunluğunu doğrula"}
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
                        Sadece başarısız kayıtlar için IP ban formu açılır. Böylece yanlış pozitif
                        riskini azaltırız.
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
                          Başarılı istek. Bu kayıt gözlem amacıyla tutulur, ban aksiyonu gerekmez.
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
  );
}
