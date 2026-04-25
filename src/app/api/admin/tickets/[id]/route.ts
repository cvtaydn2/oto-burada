import { NextResponse } from "next/server";
import { z } from "zod";

import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withAdminRoute } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { sanitizeText } from "@/lib/utils/sanitize";
import type { TicketStatus } from "@/services/support/ticket-service";
import { updateTicketStatus } from "@/services/support/ticket-service";

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

const ticketUpdateSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  adminResponse: z.string().max(2000).optional(),
});

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

  const validated = ticketUpdateSchema.parse(body);

  const sanitizedResponse = validated.adminResponse
    ? sanitizeText(validated.adminResponse)
    : undefined;

  try {
    const ticket = await updateTicketStatus(
      id,
      validated.status ?? "in_progress",
      sanitizedResponse
    );

    captureServerEvent(
      "admin_ticket_updated",
      {
        adminUserId: adminUser.id,
        ticketId: id,
        status: validated.status ?? "in_progress",
      },
      adminUser.id
    );

    return apiSuccess(ticket, "Ticket durumu güncellendi.");
  } catch (error) {
    logger.admin.error("Admin ticket update failed", error, {
      ticketId: id,
      status: validated.status,
    });
    captureServerError("Admin ticket update failed", "admin", error, { ticketId: id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
