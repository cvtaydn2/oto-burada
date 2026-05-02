/**
 * Tip Güvenli Event Sözlüğü (Type-Safe Event Dictionary)
 * -------------------------------------------------------
 * Uygulama genelindeki tüm analitik eventlerin merkezi tanımı.
 *
 * Kurallar:
 * - Hiçbir UI bileşeni veya server action'da string literal event adı KULLANMAYIN.
 * - Yeni event eklerken mutlaka bu dosyaya enum değeri + property interface'i ekleyin.
 * - Client eventleri `useAnalytics().trackEvent(...)` ile,
 *   server eventleri `trackServerEvent(...)` ile fırlatılır.
 */

// ─── Event Adları ───────────────────────────────────────────────────────────────

export enum AnalyticsEvent {
  // ── Navigation & General ──
  PAGE_VIEWED = "page_viewed",

  // ── Auth ──
  USER_SIGNED_UP = "user_signed_up",
  USER_LOGGED_IN = "user_logged_in",
  USER_LOGGED_OUT = "user_logged_out",

  // ── Search ──
  SEARCH_PERFORMED = "search_performed",

  // ── Listings (client) ──
  LISTING_VIEWED = "listing_viewed",
  LISTING_DRAFTED = "listing_drafted",
  LISTING_SUBMITTED = "listing_submitted",
  LISTING_UPDATED = "listing_updated",
  LISTING_FAVORITED = "listing_favorited",
  LISTING_UNFAVORITED = "listing_unfavorited",
  LISTING_SHARED = "listing_shared",
  LISTING_REPORTED = "listing_reported",

  // ── Listing Wizard (funnel) ──
  LISTING_WIZARD_STARTED = "listing_wizard_started",
  LISTING_WIZARD_STEP_COMPLETED = "listing_wizard_step_completed",
  LISTING_WIZARD_ABANDONED = "listing_wizard_abandoned",

  // ── Communication ──
  CHAT_STARTED = "chat_started",
  WHATSAPP_CLICKED = "whatsapp_clicked",

  // ── Profiles & Business ──
  CORPORATE_APPLICATION_SUBMITTED = "corporate_application_submitted",
  PROFILE_UPDATED = "profile_updated",

  // ── Server-Side Business Logic ──
  /** Fired on server after a listing is successfully persisted. Ad-blocker safe. */
  SERVER_LISTING_CREATED = "server_listing_created",
  /** Fired on server after a listing is updated. */
  SERVER_LISTING_UPDATED = "server_listing_updated",
  /** Fired on server after listing status changes (approve, reject, flag). */
  SERVER_LISTING_MODERATED = "server_listing_moderated",
  /** Fired on server on successful login. */
  SERVER_AUTH_LOGIN = "server_auth_login",
  /** Fired on server on successful registration. */
  SERVER_AUTH_REGISTER = "server_auth_register",
  /** Fired on server on logout. */
  SERVER_AUTH_LOGOUT = "server_auth_logout",
  /** Fired on server when a listing report is submitted. */
  SERVER_LISTING_REPORTED = "server_listing_reported",
  /** Fired on server on successful password reset/update. */
  SERVER_AUTH_PASSWORD_RESET = "server_auth_password_reset",
}

// ─── Event Property Tanımları ───────────────────────────────────────────────────

export interface EventProperties {
  // ── Navigation ──
  [AnalyticsEvent.PAGE_VIEWED]: {
    path: string;
    url: string;
    search?: string;
  };

  // ── Auth ──
  [AnalyticsEvent.USER_SIGNED_UP]: {
    method: "email" | "oauth";
  };
  [AnalyticsEvent.USER_LOGGED_IN]: {
    method: "email" | "oauth";
  };
  [AnalyticsEvent.USER_LOGGED_OUT]: Record<string, never>;

  // ── Search ──
  [AnalyticsEvent.SEARCH_PERFORMED]: {
    filters: Record<string, unknown>;
    resultCount: number;
    keyword?: string;
  };

  // ── Listings (client) ──
  [AnalyticsEvent.LISTING_VIEWED]: {
    listingId: string;
    brand: string;
    model: string;
    year: number;
    price: number;
  };
  [AnalyticsEvent.LISTING_DRAFTED]: {
    draftId: string;
  };
  [AnalyticsEvent.LISTING_SUBMITTED]: {
    listingId: string;
    brand: string;
    model: string;
    price: number;
    fraudScore?: number;
  };
  [AnalyticsEvent.LISTING_UPDATED]: {
    listingId: string;
  };
  [AnalyticsEvent.LISTING_FAVORITED]: {
    listingId: string;
  };
  [AnalyticsEvent.LISTING_UNFAVORITED]: {
    listingId: string;
  };
  [AnalyticsEvent.LISTING_SHARED]: {
    listingId: string;
    method: "copy_link" | "whatsapp" | "native_share";
  };
  [AnalyticsEvent.LISTING_REPORTED]: {
    listingId: string;
    reason: string;
  };

  // ── Listing Wizard (funnel) ──
  [AnalyticsEvent.LISTING_WIZARD_STARTED]: Record<string, never>;
  [AnalyticsEvent.LISTING_WIZARD_STEP_COMPLETED]: {
    stepName: string;
    stepIndex: number;
    timeSpentSeconds?: number;
  };
  [AnalyticsEvent.LISTING_WIZARD_ABANDONED]: {
    lastStepName: string;
    lastStepIndex?: number;
    totalTimeSpentSeconds?: number;
  };

  // ── Communication ──
  [AnalyticsEvent.CHAT_STARTED]: {
    listingId: string;
    receiverId: string;
  };
  [AnalyticsEvent.WHATSAPP_CLICKED]: {
    listingId: string;
    sellerId: string;
  };

  // ── Profiles & Business ──
  [AnalyticsEvent.CORPORATE_APPLICATION_SUBMITTED]: {
    businessName: string;
    city: string;
  };
  [AnalyticsEvent.PROFILE_UPDATED]: {
    fieldsUpdated: string[];
  };

  // ── Server-Side Business Logic ──
  [AnalyticsEvent.SERVER_LISTING_CREATED]: {
    listingId: string;
    brand: string;
    model: string;
    city: string;
    price: number;
    fraudScore?: number;
    status: string;
  };
  [AnalyticsEvent.SERVER_LISTING_UPDATED]: {
    listingId: string;
    brand: string;
    model: string;
    price: number;
  };
  [AnalyticsEvent.SERVER_LISTING_MODERATED]: {
    listingId: string;
    previousStatus: string;
    newStatus: string;
    moderatorId: string;
  };
  [AnalyticsEvent.SERVER_AUTH_LOGIN]: {
    userId: string;
    method: "email" | "oauth";
  };
  [AnalyticsEvent.SERVER_AUTH_REGISTER]: {
    userId: string;
    method: "email" | "oauth";
  };
  [AnalyticsEvent.SERVER_AUTH_LOGOUT]: {
    userId: string;
  };
  [AnalyticsEvent.SERVER_LISTING_REPORTED]: {
    listingId: string;
    reporterId: string;
    reason: string;
  };
  [AnalyticsEvent.SERVER_AUTH_PASSWORD_RESET]: {
    userId: string;
  };
}

// ─── Yardımcı Tipler ────────────────────────────────────────────────────────────

/** Belirli bir event için beklenen property tipi. */
export type EventPayload<T extends AnalyticsEvent> = EventProperties[T];

/** Sadece client-side event'leri. Server event'leri bu tipe dahil değildir. */
export type ClientAnalyticsEvent = Exclude<
  AnalyticsEvent,
  | AnalyticsEvent.SERVER_LISTING_CREATED
  | AnalyticsEvent.SERVER_LISTING_UPDATED
  | AnalyticsEvent.SERVER_LISTING_MODERATED
  | AnalyticsEvent.SERVER_AUTH_LOGIN
  | AnalyticsEvent.SERVER_AUTH_REGISTER
  | AnalyticsEvent.SERVER_AUTH_LOGOUT
  | AnalyticsEvent.SERVER_LISTING_REPORTED
  | AnalyticsEvent.SERVER_AUTH_PASSWORD_RESET
>;

/** Sadece server-side event'leri. */
export type ServerAnalyticsEvent = Extract<
  AnalyticsEvent,
  | AnalyticsEvent.SERVER_LISTING_CREATED
  | AnalyticsEvent.SERVER_LISTING_UPDATED
  | AnalyticsEvent.SERVER_LISTING_MODERATED
  | AnalyticsEvent.SERVER_AUTH_LOGIN
  | AnalyticsEvent.SERVER_AUTH_REGISTER
  | AnalyticsEvent.SERVER_AUTH_LOGOUT
  | AnalyticsEvent.SERVER_LISTING_REPORTED
  | AnalyticsEvent.SERVER_AUTH_PASSWORD_RESET
>;

/** Listing Wizard adım isimleri — PostHog funnel'larında tutarlılık sağlar. */
export const WIZARD_STEP_NAMES = [
  "Temel Bilgiler",
  "Konum ve Detaylar",
  "Ekspertiz ve Kondisyon",
  "Fotoğraflar ve Gönderim",
] as const;

export type WizardStepName = (typeof WIZARD_STEP_NAMES)[number];
