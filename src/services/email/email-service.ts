"use server";

/**
 * Email Service — Resend ile transactional email gönderimi.
 */

import { Resend } from "resend";
import { logger } from "@/lib/utils/logger";
import { getRequiredAppUrl } from "@/lib/utils/env";
import * as templates from "./email-templates";
import type { SavedSearchAlertListing } from "./email-templates";

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

  const appUrl = getRequiredAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `Re: ${params.ticketSubject} — ${APP_NAME} Destek`,
      html: templates.ticketReplyHtml({
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

  const appUrl = getRequiredAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `Destek talebiniz alındı: ${params.ticketSubject}`,
      html: templates.ticketCreatedHtml({
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

// ─── Kayıtlı Arama Yeni İlan Bildirimi ──────────────────────────────────────

export async function sendSavedSearchAlertEmail(params: {
  toEmail: string;
  toName: string;
  searchTitle: string;
  searchUrl: string;
  newListings: SavedSearchAlertListing[];
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: "Email servisi yapılandırılmamış (RESEND_API_KEY eksik)." };
  }

  const appUrl = getRequiredAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `${params.newListings.length} yeni araç bulundu: ${params.searchTitle}`,
      html: templates.savedSearchAlertHtml({
        toName: params.toName,
        searchTitle: params.searchTitle,
        searchUrl: params.searchUrl,
        newListings: params.newListings,
        appUrl,
        appName: APP_NAME,
      }),
    });

    if (error) {
      logger.notifications.error("Saved search alert email failed", error, {
        toEmail: params.toEmail,
        searchTitle: params.searchTitle,
      });
      return { success: false, error: error.message };
    }

    logger.notifications.info("Saved search alert email sent", {
      toEmail: params.toEmail,
      listingCount: params.newListings.length,
      messageId: data?.id,
    });
    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.notifications.error("Saved search alert email unexpected error", err);
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ─── İlan Yayınlandı Bildirimi (Satıcıya) ───────────────────────────────────

export async function sendListingApprovedEmail(params: {
  toEmail: string;
  toName: string;
  listingTitle: string;
  listingUrl: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) return { success: false, error: "Email servisi yapılandırılmamış." };

  const appUrl = getRequiredAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `İlanın yayınlandı: ${params.listingTitle}`,
      html: templates.listingApprovedHtml({
        toName: params.toName,
        listingTitle: params.listingTitle,
        listingUrl: params.listingUrl,
        dashboardUrl: `${appUrl}/dashboard/listings`,
        appName: APP_NAME,
      }),
    });

    if (error) {
      logger.listings.error("Listing approved email failed", error, { listingTitle: params.listingTitle });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ─── İlan Reddedildi Bildirimi (Satıcıya) ───────────────────────────────────

export async function sendListingRejectedEmail(params: {
  toEmail: string;
  toName: string;
  listingTitle: string;
  reason?: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) return { success: false, error: "Email servisi yapılandırılmamış." };

  const appUrl = getRequiredAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `İlanın incelendi: ${params.listingTitle}`,
      html: templates.listingRejectedHtml({
        toName: params.toName,
        listingTitle: params.listingTitle,
        reason: params.reason,
        dashboardUrl: `${appUrl}/dashboard/listings`,
        appName: APP_NAME,
      }),
    });

    if (error) {
      logger.listings.error("Listing rejected email failed", error, { listingTitle: params.listingTitle });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}
