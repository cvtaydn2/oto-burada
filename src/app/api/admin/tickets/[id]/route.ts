import { NextResponse } from "next/server";

import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withAdminRoute } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { sanitizeText } from "@/lib/utils/sanitize";
import type { TicketStatus } from "@/services/support/ticket-service";
import { updateTicketStatus } from "@/services/support/ticket-service";

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const { status, adminResponse } = body as { status?: string; adminResponse?: string };

  if (status && !VALID_STATUSES.includes(status as TicketStatus)) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      `Geçersiz durum. Geçerli değerler: ${VALID_STATUSES.join(", ")}`,
      400
    );
  }

  const sanitizedResponse = adminResponse ? sanitizeText(adminResponse) : undefined;

  try {
    const ticket = await updateTicketStatus(
      id,
      (status as TicketStatus) ?? "in_progress",
      sanitizedResponse
    );

    captureServerEvent(
      "admin_ticket_updated",
      {
        adminUserId: adminUser.id,
        ticketId: id,
        status: status ?? "in_progress",
      },
      adminUser.id
    );

    return apiSuccess(ticket, "Ticket durumu güncellendi.");
  } catch (error) {
    logger.admin.error("Admin ticket update failed", error, { ticketId: id, status });
    captureServerError("Admin ticket update failed", "admin", error, { ticketId: id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
