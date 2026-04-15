import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { updateTicketStatus } from "@/services/support/ticket-service";
import type { TicketStatus } from "@/services/support/ticket-service";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { sanitizeText } from "@/lib/utils/sanitize";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin-only endpoint
  const adminUser = await requireApiAdminUser();
  if (adminUser instanceof Response) return adminUser;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const { status, adminResponse } = body as { status?: string; adminResponse?: string };

  if (status && !VALID_STATUSES.includes(status as TicketStatus)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, `Geçersiz durum. Geçerli değerler: ${VALID_STATUSES.join(", ")}`, 400);
  }

  const sanitizedResponse = adminResponse ? sanitizeText(adminResponse) : undefined;

  try {
    const ticket = await updateTicketStatus(id, (status as TicketStatus) ?? "in_progress", sanitizedResponse);
    return apiSuccess(ticket, "Ticket durumu güncellendi.");
  } catch (error) {
    logger.admin.error("Admin ticket update failed", error, { ticketId: id, status });
    captureServerError("Admin ticket update failed", "admin", error, { ticketId: id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
