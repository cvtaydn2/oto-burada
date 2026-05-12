import { NextResponse } from "next/server";
import { z } from "zod";

import { updateTicketStatus } from "@/features/support/services/support/ticket-actions";
import type { TicketStatus } from "@/features/support/services/support/ticket-logic";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { sanitizeText } from "@/lib/sanitize";
import { withAdminRoute } from "@/lib/security";
import { captureServerError, captureServerEvent } from "@/lib/telemetry-server";

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

  const validated = ticketUpdateSchema.safeParse(body);

  if (!validated.success) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Destek talebi güncelleme alanlarını kontrol et.",
      400
    );
  }

  const sanitizedResponse = validated.data.adminResponse
    ? sanitizeText(validated.data.adminResponse)
    : undefined;

  try {
    const ticket = await updateTicketStatus(
      id,
      validated.data.status ?? "in_progress",
      sanitizedResponse
    );

    captureServerEvent(
      "admin_ticket_updated",
      {
        adminUserId: adminUser.id,
        ticketId: id,
        status: validated.data.status ?? "in_progress",
      },
      adminUser.id
    );

    return apiSuccess(ticket, "Ticket durumu güncellendi.");
  } catch (error) {
    logger.admin.error("Admin ticket update failed", error, {
      ticketId: id,
      status: validated.data.status,
    });
    captureServerError("Admin ticket update failed", "admin", error, { ticketId: id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
