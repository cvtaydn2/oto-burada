import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createTicket } from "@/services/support/ticket-service";
import type { TicketCategory, TicketPriority } from "@/services/support/ticket-service";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";

const VALID_CATEGORIES: TicketCategory[] = ["listing", "account", "payment", "technical", "feedback", "other"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

// Ticket creation: 5 per hour per user
const TICKET_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  // IP-level rate limit
  const ipLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:tickets:create"),
    rateLimitProfiles.general,
  );
  if (ipLimit) return ipLimit.response;

  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum açmanız gerekiyor.", 401);
  }

  // User-level rate limit
  const userLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:tickets:create"),
    TICKET_RATE_LIMIT,
  );
  if (userLimit) return userLimit.response;

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // IP-level rate limit
  const ipLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:tickets:list"),
    rateLimitProfiles.general,
  );
  if (ipLimit) return ipLimit.response;

  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum açmanız gerekiyor.", 401);
  }

  try {
    const { getUserTickets } = await import("@/services/support/ticket-service");
    const tickets = await getUserTickets(user.id);
    return apiSuccess(tickets);
  } catch (error) {
    logger.api.error("Get tickets failed", error, { userId: user.id });
    captureServerError("Get tickets failed", "support", error, { userId: user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
