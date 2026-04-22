import { NextResponse } from "next/server";
import { withAdminRoute } from "@/lib/utils/api-security";
import { grantCreditsToUser, grantDopingToListing } from "@/services/admin/users";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { z } from "zod";

const grantCreditsSchema = z.object({
  action: z.literal("grant_credits"),
  credits: z.number().int().min(1).max(1000),
  note: z.string().min(3).max(200),
});

const grantDopingSchema = z.object({
  action: z.literal("grant_doping"),
  listingId: z.string().uuid(),
  dopingTypes: z.array(z.enum(["featured", "urgent", "highlighted"])).min(1),
  durationDays: z.number().int().min(1).max(90),
});

const bodySchema = z.discriminatedUnion("action", [grantCreditsSchema, grantDopingSchema]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  const { userId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek: " + parsed.error.issues[0]?.message, 400);
  }

  try {
    if (parsed.data.action === "grant_credits") {
      const result = await grantCreditsToUser(
        userId,
        parsed.data.credits,
        parsed.data.note,
        adminUser.id,
      );
      if (!result.success) return apiError(API_ERROR_CODES.INTERNAL_ERROR, result.error ?? "Hata", 500);
      captureServerEvent("admin_credits_granted", {
        adminUserId: adminUser.id,
        targetUserId: userId,
        credits: parsed.data.credits,
      }, adminUser.id);
      return apiSuccess({ userId, credits: parsed.data.credits }, `${parsed.data.credits} kredi başarıyla tanımlandı.`);
    }

    if (parsed.data.action === "grant_doping") {
      const result = await grantDopingToListing(
        parsed.data.listingId,
        parsed.data.dopingTypes,
        parsed.data.durationDays,
        adminUser.id,
      );
      if (!result.success) return apiError(API_ERROR_CODES.INTERNAL_ERROR, result.error ?? "Hata", 500);
      captureServerEvent("admin_doping_granted", {
        adminUserId: adminUser.id,
        targetUserId: userId,
        listingId: parsed.data.listingId,
        dopingTypes: parsed.data.dopingTypes,
        durationDays: parsed.data.durationDays,
      }, adminUser.id);
      return apiSuccess({ listingId: parsed.data.listingId }, "Doping başarıyla tanımlandı.");
    }

    return apiError(API_ERROR_CODES.BAD_REQUEST, "Bilinmeyen aksiyon.", 400);
  } catch (err) {
    logger.admin.error("Admin user action failed", err, { userId });
    captureServerError("Admin user action failed", "admin", err, {
      adminUserId: adminUser.id,
      targetUserId: userId,
    }, adminUser.id);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
