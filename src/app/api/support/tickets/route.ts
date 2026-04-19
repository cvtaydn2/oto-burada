import { createTicket } from "@/services/support/ticket-service";
import type { TicketCategory, TicketPriority } from "@/services/support/ticket-service";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { withAuthAndCsrf, withAuth } from "@/lib/utils/api-security";

const VALID_CATEGORIES: TicketCategory[] = ["listing", "account", "payment", "technical", "feedback", "other"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

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

  const { subject, description, category, priority, listingId } = body as Record<string, unknown>;

  if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Konu en az 3 karakter olmalıdır.", 400);
  }
  if (!description || typeof description !== "string" || description.trim().length < 10) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Açıklama en az 10 karakter olmalıdır.", 400);
  }
  if (category && !VALID_CATEGORIES.includes(category as TicketCategory)) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçersiz kategori.", 400);
  }
  if (priority && !VALID_PRIORITIES.includes(priority as TicketPriority)) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçersiz öncelik.", 400);
  }

  try {
    const ticket = await createTicket(user.id, {
      subject: sanitizeText(subject.trim()),
      description: sanitizeDescription((description as string).trim()),
      category: (category as TicketCategory) ?? "other",
      priority: (priority as TicketPriority) ?? "medium",
      listingId: typeof listingId === "string" ? listingId : undefined,
    });

    captureServerEvent("support_ticket_created", {
      userId: user.id,
      ticketId: ticket.id,
      category: (category as TicketCategory) ?? "other",
    }, user.id);

    return apiSuccess(ticket, "Destek talebiniz oluşturuldu.", 201);
  } catch (error) {
    logger.api.error("Ticket creation failed", error, { userId: user.id });
    captureServerError("Ticket creation failed", "support", error, { userId: user.id });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Destek talebi oluşturulamadı. Lütfen tekrar dene.", 500);
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
