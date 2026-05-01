import { AlertTriangle, Ban, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

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

async function getAbuseData() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Kritik Yapılandırma Hatası: SUPABASE_SERVICE_ROLE_KEY eksik. Güvenlik verilerine erişilemiyor."
    );
  }

  const admin = createSupabaseAdminClient();

  const [logsResult, bannedResult, statsResult] = await Promise.all([
    admin
      .from("contact_abuse_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("ip_banlist").select("*").order("banned_at", { ascending: false }),
    admin
      .from("contact_abuse_log")
      .select("reason")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const logs = (logsResult.data || []) as AbuseLog[];
  const bannedIPs = (bannedResult.data || []) as BannedIP[];

  // Calculate stats
  const last24h = statsResult.data || [];
  const reasonCounts = last24h.reduce(
    (acc, log) => {
      acc[log.reason] = (acc[log.reason] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    logs,
    bannedIPs,
    stats: {
      total24h: last24h.length,
      reasonCounts,
    },
  };
}

export default async function SecurityPage() {
  // Redundant: AdminLayout already calls requireAdminUser()
  // But we keep a try-catch for the data fetching which requires service role key

  let data;
  try {
    data = await getAbuseData();
  } catch (error) {
    logger.security.error("[SecurityPage] Failed to fetch abuse data", error);
    return (
      <div className="p-8 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Veri Erişim Hatası
        </h2>
        <p className="text-sm opacity-90">
          {(error as Error).message ||
            "Güvenlik verileri alınırken bir hata oluştu. Lütfen ortam değişkenlerini (SUPABASE_SERVICE_ROLE_KEY) kontrol edin."}
        </p>
        <Button
          variant="outline"
          className="mt-4 border-destructive/30 hover:bg-destructive/10"
          asChild
        >
          <Link href="/admin">Geri Dön</Link>
        </Button>
      </div>
    );
  }

  const { logs, bannedIPs, stats } = data;

  const reasonColors: Record<string, string> = {
    honeypot: "bg-red-100 text-red-800",
    spam_pattern: "bg-orange-100 text-orange-800",
    similarity: "bg-yellow-100 text-yellow-800",
    rate_limit: "bg-blue-100 text-blue-800",
    disposable_email: "bg-purple-100 text-purple-800",
    turnstile_fail: "bg-pink-100 text-pink-800",
    ip_banned: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Güvenlik & Abuse Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Contact form spam ve bot saldırılarını izle</p>
        </div>
        <Shield className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son 24 Saat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total24h || 0}</div>
            <p className="text-xs text-muted-foreground">Toplam deneme</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yasaklı IP</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedIPs.length}</div>
            <p className="text-xs text-muted-foreground">Aktif ban</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Çok Tetiklenen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.reasonCounts
                ? Object.entries(stats.reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.reasonCounts
                ? Object.entries(stats.reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0
                : 0}{" "}
              kez
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Banned IPs */}
      <Card>
        <CardHeader>
          <CardTitle>Yasaklı IP Adresleri</CardTitle>
          <CardDescription>Bu IP&apos;ler contact form&apos;u kullanamaz</CardDescription>
        </CardHeader>
        <CardContent>
          {bannedIPs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz yasaklı IP yok.</p>
          ) : (
            <div className="space-y-2">
              {bannedIPs.map((ban) => (
                <div
                  key={ban.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">{ban.ip_address}</p>
                    <p className="text-xs text-muted-foreground">{ban.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(ban.banned_at).toLocaleDateString("tr-TR")}
                    </p>
                    {ban.expires_at ? (
                      <p className="text-xs text-orange-600">
                        Bitiş: {new Date(ban.expires_at).toLocaleDateString("tr-TR")}
                      </p>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Kalıcı
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abuse Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Abuse Log (Son 100)</CardTitle>
          <CardDescription>Tüm contact form denemeleri (başarılı ve başarısız)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={reasonColors[log.reason] || "bg-gray-100 text-gray-800"}>
                      {log.reason}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {log.ip_address}
                    </span>
                  </div>
                  <p className="text-sm">{log.email}</p>
                  {log.user_agent && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {log.user_agent}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("tr-TR")}
                  </p>
                  {log.reason !== "success" && (
                    <form action="/api/admin/security/ban" method="POST">
                      <input type="hidden" name="ip" value={log.ip_address} />
                      <input type="hidden" name="reason" value={`Abuse: ${log.reason}`} />
                      <Button type="submit" size="sm" variant="destructive" className="text-xs">
                        <Ban className="w-3 h-3 mr-1" />
                        Ban IP
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
