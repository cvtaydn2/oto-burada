import { z } from "zod";

import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withAuth, withAuthAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { sanitizeDescription, sanitizeText } from "@/lib/utils/sanitize";
import type { TicketCategory, TicketPriority } from "@/services/support/ticket-service";
import { createTicket } from "@/services/support/ticket-service";

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
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.ticketCreate,
    rateLimitKey: "tickets:create",
  });

  if (!security.ok) return security.response;
  const user = security.user!; // Guaranteed by withAuthAndCsrf

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  if (!body || typeof body !== "object") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek formatı.", 400);
  }

  const validated = ticketCreateSchema.parse(body);

  try {
    const ticket = await createTicket(user.id, {
      subject: sanitizeText(validated.subject),
      description: sanitizeDescription(validated.description),
      category: validated.category ?? "other",
      priority: validated.priority ?? "medium",
      listingId: validated.listingId,
    });

    captureServerEvent(
      "support_ticket_created",
      {
        userId: user.id,
        ticketId: ticket.id,
        category: validated.category ?? "other",
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
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "tickets:list",
  });

  if (!security.ok) return security.response;
  const user = security.user!; // Guaranteed by withAuth

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
