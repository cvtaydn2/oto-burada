import { NextResponse } from "next/server";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/rate-limiting/rate-limit-middleware";
import { sanitizeDescription, sanitizeText } from "@/lib/sanitization/sanitize";
import { isValidRequestOrigin } from "@/lib/security";
import { getDisposableEmailMessage, isDisposableEmail } from "@/lib/security/email-validation";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/security/turnstile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { contactFormSchema } from "@/lib/validators/domain";
import { createPublicTicket } from "@/services/support/ticket-service";

// ── Spam heuristics ───────────────────────────────────────────────────────────

/** Patterns that strongly indicate spam or automated abuse. */
const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|crypto|bitcoin|nft|loan|forex|investment)\b/i,
  /https?:\/\/[^\s]{30,}/, // long URLs in message body
  /(.)\1{6,}/, // 7+ repeated characters (aaaaaaa)
  /\b\d{10,}\b/, // 10+ digit number sequences (phone spam)
];

/** Returns true when the message body matches a known spam pattern. */
function looksLikeSpam(text: string): boolean {
  return SPAM_PATTERNS.some((re) => re.test(text));
}

/**
 * Rough similarity check: if subject and message are nearly identical
 * (e.g. bot copy-pasting the same string) treat it as suspicious.
 */
function subjectMessageTooSimilar(subject: string, message: string): boolean {
  const s = subject.trim().toLowerCase();
  const m = message.trim().toLowerCase();
  // If message starts with or fully contains the subject verbatim it's suspicious
  return m.startsWith(s) && m.length < s.length + 20;
}

/**
 * Log an abuse attempt to the database for tracking and analysis.
 */
async function logAbuse(
  email: string,
  ip: string,
  reason: string,
  userAgent: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!hasSupabaseAdminEnv()) return;

  try {
    const admin = createSupabaseAdminClient();
    await admin.rpc("log_contact_abuse", {
      p_email: email,
      p_ip: ip,
      p_reason: reason,
      p_user_agent: userAgent,
      p_metadata: metadata,
    });
  } catch (error) {
    logger.api.error("Failed to log contact abuse", error);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  // Extract IP and User-Agent early for logging
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent");

  // 1. CSRF — origin must match our app domain
  if (!isValidRequestOrigin(request)) {
    await logAbuse("", clientIp, "csrf_origin_mismatch", userAgent);
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  // 2. Rate limit — 3 submissions per hour per IP (tighter than general)
  const ipLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:contact:create"),
    rateLimitProfiles.contactCreate
  );
  if (ipLimit) {
    await logAbuse("", clientIp, "rate_limit", userAgent);
    return ipLimit.response;
  }

  // 3. Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Mesaj içeriği okunamadı.", 400);
  }

  // 4. Zod validation (includes honeypot field `_hp`)
  const parsed = contactFormSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Form alanlarını kontrol et.";
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, firstMessage, 400);
  }

  const { name, email, subject, message, _hp, turnstileToken } = parsed.data;

  // 5. Honeypot check — bots fill the hidden field, humans don't
  if (_hp && _hp.length > 0) {
    logger.api.warn("Contact form honeypot triggered", { ip: clientIp });
    await logAbuse(email, clientIp, "honeypot", userAgent);
    captureServerEvent("contact_form_bot_detected", {
      reason: "honeypot",
      ip: clientIp,
    });
    // Return 200 so bots don't know they were blocked
    return NextResponse.json({ success: true });
  }

  // 6. Turnstile verification (if enabled)
  if (isTurnstileEnabled()) {
    if (!turnstileToken) {
      await logAbuse(email, clientIp, "turnstile_missing", userAgent);
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Doğrulama token'ı eksik. Lütfen sayfayı yenileyin.",
        400
      );
    }

    const isValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isValid) {
      await logAbuse(email, clientIp, "turnstile_fail", userAgent);
      captureServerEvent("contact_form_bot_detected", {
        reason: "turnstile_fail",
        ip: clientIp,
      });
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Doğrulama başarısız. Lütfen tekrar deneyin.",
        400
      );
    }
  }

  // 7. Disposable email check
  if (isDisposableEmail(email)) {
    logger.api.warn("Contact form disposable email detected", { ip: clientIp, email });
    await logAbuse(email, clientIp, "disposable_email", userAgent);
    captureServerEvent("contact_form_spam_detected", {
      reason: "disposable_email",
      ip: clientIp,
    });
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, getDisposableEmailMessage(), 400);
  }

  // 8. Check IP banlist and abuse history (Supabase RPC)
  if (hasSupabaseAdminEnv()) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: abuseCheck } = await admin.rpc("check_contact_abuse", {
        p_email: email,
        p_ip: clientIp,
      });

      if (abuseCheck && !abuseCheck.allowed) {
        logger.api.warn("Contact form abuse check failed", {
          ip: clientIp,
          email,
          reason: abuseCheck.reason,
        });
        await logAbuse(email, clientIp, abuseCheck.reason as string, userAgent, {
          count: abuseCheck.count,
        });
        captureServerEvent("contact_form_abuse_blocked", {
          reason: abuseCheck.reason,
          ip: clientIp,
        });
        return apiError(
          API_ERROR_CODES.BAD_REQUEST,
          (abuseCheck.message as string) ||
            "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
          429
        );
      }
    } catch (error) {
      logger.api.error("Abuse check RPC failed", error);
      // Continue — don't block legitimate users if DB is down
    }
  }

  // 9. Spam content analysis
  if (looksLikeSpam(message) || looksLikeSpam(subject)) {
    logger.api.warn("Contact form spam pattern detected", { ip: clientIp, subject });
    await logAbuse(email, clientIp, "spam_pattern", userAgent);
    captureServerEvent("contact_form_spam_detected", {
      reason: "pattern_match",
      ip: clientIp,
    });
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Mesajınız spam içeriği nedeniyle gönderilemedi. Lütfen içeriği düzenleyip tekrar deneyin.",
      400
    );
  }

  // 10. Subject / message similarity check
  if (subjectMessageTooSimilar(subject, message)) {
    logger.api.warn("Contact form subject/message too similar", { ip: clientIp });
    await logAbuse(email, clientIp, "similarity", userAgent);
    captureServerEvent("contact_form_spam_detected", {
      reason: "subject_message_similarity",
      ip: clientIp,
    });
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      "Mesajınız konu başlığından farklı bir içerik içermelidir.",
      400
    );
  }

  // 11. Create ticket
  try {
    const ticket = await createPublicTicket({
      category: "other",
      contactEmail: sanitizeText(email),
      contactName: sanitizeText(name),
      description: sanitizeDescription(message),
      priority: "medium",
      subject: sanitizeText(subject),
    });

    // Log successful submission (for frequency analysis)
    await logAbuse(email, clientIp, "success", userAgent, {
      ticketId: ticket.id,
      subject,
    });

    captureServerEvent("contact_form_submitted", {
      category: "other",
      ticketId: ticket.id,
    });

    return apiSuccess(ticket, "Mesajın bize ulaştı. En kısa sürede dönüş yapacağız.", 201);
  } catch (error) {
    logger.api.error("Public contact form submission failed", error);
    captureServerError("Public contact form submission failed", "support", error);
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Mesaj gönderilemedi. Lütfen tekrar dene.",
      500
    );
  }
}
