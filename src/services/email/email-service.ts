"use server";

/**
 * Email Service — Resend ile transactional email gönderimi.
 *
 * Kurulum:
 * 1. https://resend.com adresinden ücretsiz hesap aç
 * 2. API key al → Vercel env'e RESEND_API_KEY olarak ekle
 * 3. RESEND_FROM_EMAIL env'e gönderici adresi ekle (örn: destek@otoburada.com)
 *    Domain doğrulaması yapılana kadar onboarding@resend.dev kullanılabilir.
 *
 * Env değişkenleri:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   RESEND_FROM_EMAIL=destek@otoburada.com
 */

import { Resend } from "resend";
import { logger } from "@/lib/utils/logger";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.admin.warn("RESEND_API_KEY eksik — email gönderilemez");
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "OtoBurada <onboarding@resend.dev>";
const APP_NAME = "OtoBurada";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Ticket Yanıt E-postası ──────────────────────────────────────────────────

export async function sendTicketReplyEmail(params: {
  toEmail: string;
  toName: string;
  ticketSubject: string;
  adminResponse: string;
  ticketId: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: "Email servisi yapılandırılmamış (RESEND_API_KEY eksik)." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://otoburada.com";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `Re: ${params.ticketSubject} — ${APP_NAME} Destek`,
      html: ticketReplyHtml({
        toName: params.toName,
        ticketSubject: params.ticketSubject,
        adminResponse: params.adminResponse,
        ticketUrl: `${appUrl}/dashboard/support`,
        appName: APP_NAME,
      }),
    });

    if (error) {
      logger.admin.error("Ticket reply email failed", error, { ticketId: params.ticketId });
      return { success: false, error: error.message };
    }

    logger.admin.info("Ticket reply email sent", { ticketId: params.ticketId, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.admin.error("Ticket reply email unexpected error", err, { ticketId: params.ticketId });
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ─── Ticket Oluşturuldu Bildirimi (Kullanıcıya) ──────────────────────────────

export async function sendTicketCreatedEmail(params: {
  toEmail: string;
  toName: string;
  ticketSubject: string;
  ticketId: string;
  ticketUrl?: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) return { success: false, error: "Email servisi yapılandırılmamış." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://otoburada.com";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `Destek talebiniz alındı: ${params.ticketSubject}`,
      html: ticketCreatedHtml({
        toName: params.toName,
        ticketSubject: params.ticketSubject,
        ticketUrl: params.ticketUrl ?? `${appUrl}/dashboard/support`,
        appName: APP_NAME,
      }),
    });

    if (error) {
      logger.admin.error("Ticket created email failed", error, { ticketId: params.ticketId });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ─── HTML Şablonları ─────────────────────────────────────────────────────────

function ticketReplyHtml(p: {
  toName: string;
  ticketSubject: string;
  adminResponse: string;
  ticketUrl: string;
  appName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Destek Ekibi</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 24px;color:#0f172a;font-size:20px;font-weight:900;">Destek talebinize yanıt verildi</h2>
            
            <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Konu</p>
              <p style="margin:4px 0 0;color:#0f172a;font-size:15px;font-weight:700;">${p.ticketSubject}</p>
            </div>

            <div style="border-left:4px solid #2563eb;padding:16px 20px;background:#eff6ff;border-radius:0 12px 12px 0;margin-bottom:32px;">
              <p style="margin:0 0 8px;color:#1d4ed8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Destek Ekibinin Yanıtı</p>
              <p style="margin:0;color:#1e3a5f;font-size:15px;line-height:1.6;">${p.adminResponse.replace(/\n/g, "<br>")}</p>
            </div>

            <a href="${p.ticketUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;letter-spacing:0.5px;">
              Destek Taleplerime Git →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta ${p.appName} destek sistemi tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ticketCreatedHtml(p: {
  toName: string;
  ticketSubject: string;
  ticketUrl: string;
  appName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Destek Ekibi</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900;">Destek talebiniz alındı ✓</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              <strong>"${p.ticketSubject}"</strong> konulu destek talebiniz ekibimize iletildi. En kısa sürede yanıt vereceğiz.
            </p>
            <a href="${p.ticketUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;">
              Talebi Görüntüle →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta ${p.appName} destek sistemi tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
