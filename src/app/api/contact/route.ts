import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeDescription, sanitizeText } from "@/lib/utils/sanitize";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { logger } from "@/lib/utils/logger";
import { createPublicTicket, type TicketCategory, type TicketPriority } from "@/services/support/ticket-service";

const VALID_CATEGORIES: TicketCategory[] = ["listing", "account", "payment", "technical", "feedback", "other"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:contact:create"),
    rateLimitProfiles.general,
  );

  if (ipLimit) {
    return ipLimit.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Mesaj içeriği okunamadı.", 400);
  }

  const {
    category,
    email,
    message,
    name,
    priority,
    subject,
  } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Ad soyad en az 2 karakter olmalıdır.", 400);
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçerli bir e-posta adresi gir.", 400);
  }

  if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Konu en az 3 karakter olmalıdır.", 400);
  }

  if (!message || typeof message !== "string" || message.trim().length < 10) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Mesaj en az 10 karakter olmalıdır.", 400);
  }

  if (category && !VALID_CATEGORIES.includes(category as TicketCategory)) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçersiz kategori.", 400);
  }

  if (priority && !VALID_PRIORITIES.includes(priority as TicketPriority)) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçersiz öncelik.", 400);
  }

  try {
    const ticket = await createPublicTicket({
      category: (category as TicketCategory) ?? "other",
      contactEmail: sanitizeText(email.trim()),
      contactName: sanitizeText(name.trim()),
      description: sanitizeDescription(message.trim()),
      priority: (priority as TicketPriority) ?? "medium",
      subject: sanitizeText(subject.trim()),
    });

    captureServerEvent("contact_form_submitted", {
      category: (category as TicketCategory) ?? "other",
      priority: (priority as TicketPriority) ?? "medium",
      ticketId: ticket.id,
    });

    return apiSuccess(ticket, "Mesajın bize ulaştı. En kısa sürede dönüş yapacağız.", 201);
  } catch (error) {
    logger.api.error("Public contact form submission failed", error);
    captureServerError("Public contact form submission failed", "support", error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Mesaj gönderilemedi. Lütfen tekrar dene.", 500);
  }
}
