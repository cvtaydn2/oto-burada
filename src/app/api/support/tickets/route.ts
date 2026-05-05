import { z } from "zod";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withUserAndCsrf, withUserRoute } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/telemetry-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { sanitizeDescription, sanitizeText } from "@/lib/sanitization/sanitize";
import type { TicketCategory, TicketPriority } from "@/services/support/ticket-service";
import { createTicket } from "@/services/support/ticket-service";

// Import types from service - single source of truth
const VALID_CATEGORIES: TicketCategory[] = [
  "listing",
  "account",
  "payment",
  "technical",
  "feedback",
  "other",
];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

const ticketCreateSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(VALID_CATEGORIES).optional(),
  priority: z.enum(VALID_PRIORITIES).optional(),
  listingId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.ticketCreate,
    rateLimitKey: "tickets:create",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  if (!body || typeof body !== "object") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek formatı.", 400);
  }

  const validated = ticketCreateSchema.safeParse(body);

  if (!validated.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      validated.error.issues[0]?.message ?? "Destek talebi alanlarını kontrol et.",
      400
    );
  }

  try {
    const ticket = await createTicket(user.id, {
      subject: sanitizeText(validated.data.subject),
      description: sanitizeDescription(validated.data.description),
      category: validated.data.category ?? "other",
      priority: validated.data.priority ?? "medium",
      listingId: validated.data.listingId,
    });

    captureServerEvent(
      "support_ticket_created",
      {
        userId: user.id,
        ticketId: ticket.id,
        category: validated.data.category ?? "other",
      },
      user.id
    );

    return apiSuccess(ticket, "Destek talebiniz oluşturuldu.", 201);
  } catch (error) {
    logger.api.error("Ticket creation failed", error, { userId: user.id });
    captureServerError("Ticket creation failed", "support", error, { userId: user.id });
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Destek talebi oluşturulamadı. Lütfen tekrar dene.",
      500
    );
  }
}

export async function GET(request: Request) {
  const security = await withUserRoute(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "tickets:list",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  try {
    const { getUserTickets } = await import("@/services/support/ticket-service");
    const tickets = await getUserTickets(user.id);
    return apiSuccess(tickets);
  } catch (error) {
    logger.api.error("Get tickets failed", error, { userId: user.id });
    captureServerError("Get tickets failed", "support", error, { userId: user.id });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Destek talepleri yüklenemedi.", 500);
  }
}
