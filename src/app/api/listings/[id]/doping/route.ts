import { z } from "zod";

import { activateDopingUseCase } from "@/domain/usecases/doping-activate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";

const dopingRequestSchema = z.object({
  packageId: z.string().min(1, "Paket ID gerekli."),
  paymentId: z.string().uuid("Geçersiz ödeme ID."),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "listings:doping",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  const { id: listingId } = await params;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek gövdesi.", 400);
  }

  const parsed = dopingRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      firstError?.message ?? "Geçersiz istek.",
      400
    );
  }

  const { packageId, paymentId } = parsed.data;

  // Verify listing ownership
  const supabase = await createSupabaseServerClient();
  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .single();

  if (fetchError || !listing) {
    return apiError(
      API_ERROR_CODES.NOT_FOUND,
      "İlan bulunamadı veya bu işlem için yetkiniz yok.",
      404
    );
  }

  if (listing.status !== "approved") {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Doping yalnızca onaylanmış ilanlara uygulanabilir.",
      400
    );
  }

  try {
    const result = await activateDopingUseCase({
      userId: user.id,
      listingId,
      packageId,
      paymentId,
    });

    if (!result.success) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.error ?? "Doping aktif edilemedi.", 400);
    }

    logger.payments.info("Doping activated", { userId: user.id, listingId, packageId });

    return apiSuccess(
      { purchaseId: result.purchase?.purchaseId, expiresAt: result.purchase?.expiresAt },
      "Doping başarıyla aktif edildi."
    );
  } catch (error) {
    logger.payments.error("Doping activation failed", error, { listingId, packageId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Doping aktif edilirken bir hata oluştu.", 500);
  }
}
