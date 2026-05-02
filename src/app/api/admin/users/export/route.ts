import { withAdminRoute } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  try {
    const admin = createSupabaseAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name, phone, city, role, user_type, is_verified, is_banned, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      logger.admin.error("User export query failed", error);
      captureServerError(
        "User export query failed",
        "admin",
        error,
        {
          adminUserId: adminUser.id,
        },
        adminUser.id
      );
      return new Response("Export başarısız", { status: 500 });
    }

    captureServerEvent(
      "admin_users_exported",
      {
        adminUserId: adminUser.id,
        count: profiles?.length ?? 0,
      },
      adminUser.id
    );

    const headers = [
      "ID",
      "Ad Soyad",
      "Telefon",
      "Şehir",
      "Rol",
      "Tip",
      "Doğrulandı",
      "Yasaklı",
      "Kayıt Tarihi",
    ];
    const rows = (profiles ?? []).map((p) => [
      p.id,
      p.full_name ?? "",
      p.phone ?? "",
      p.city ?? "",
      p.role ?? "user",
      p.user_type ?? "individual",
      p.is_verified ? "Evet" : "Hayır",
      p.is_banned ? "Evet" : "Hayır",
      new Date(p.created_at).toLocaleDateString("tr-TR"),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kullanicilar-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    logger.admin.error("User export unexpected error", err);
    captureServerError(
      "admin_users_unexpected_error",
      "admin",
      err,
      {
        adminUserId: adminUser.id,
      },
      adminUser.id
    );
    return new Response("Sunucu hatası", { status: 500 });
  }
}
