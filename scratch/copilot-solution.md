Aşağıda canonical ayrışmaya, güvenli read/write kontratlarına, Zod validasyonuna, atomik response korumasına ve geriye dönük uyumluluk katmanına göre güncellenmiş tam çözüm dosyaları yer alıyor.

<write_file path="src/features/exchange/services/exchange/exchange-offer.types.ts">
export type ExchangeOfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type ExchangeOfferResponse = "accepted" | "rejected";

export interface ExchangeOfferRow {
  id: string;
  listing_id: string;
  offerer_id: string;
  target_listing_id: string | null;
  target_car_desc: string;
  target_price: number | null;
  target_brand: string | null;
  target_model: string | null;
  target_year: number | null;
  target_mileage: number | null;
  notes: string | null;
  status: ExchangeOfferStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeOfferListingSummary {
  id: string;
  title: string;
  slug: string;
}

export interface IncomingExchangeOffer extends ExchangeOfferRow {
  listing: ExchangeOfferListingSummary | null;
}

export interface OutgoingExchangeOffer extends ExchangeOfferRow {
  listing: ExchangeOfferListingSummary | null;
}

export interface ExchangeListingOwnershipRow {
  id: string;
  seller_id: string;
}

export interface CreateExchangeOfferInput {
  listingId: string;
  targetListingId?: string | null;
  targetCarDesc: string;
  targetPrice?: number | null;
  targetBrand?: string | null;
  targetModel?: string | null;
  targetYear?: number | null;
  targetMileage?: number | null;
  notes?: string | null;
}

export interface RespondToExchangeOfferInput {
  offerId: string;
  response: ExchangeOfferResponse;
}

export type ExchangeActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SELF_OFFER"
  | "ALREADY_RESPONDED"
  | "EXPIRED"
  | "OPERATION_FAILED"
  | "DB_ERROR";

export interface ExchangeActionError {
  code: ExchangeActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type ExchangeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ExchangeActionError };

export interface ExchangeOfferMutationResult {
  offerId: string;
  status: ExchangeOfferStatus;
  expiresAt: string | null;
}

export interface ExchangeOfferListResult {
  offers: IncomingExchangeOffer[] | OutgoingExchangeOffer[];
}
</write_file>

<write_file path="src/features/exchange/services/exchange/exchange-offer.schema.ts">
import { z } from "zod";

const currentYear = new Date().getFullYear() + 1;

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function emptyToNull(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export const exchangeOfferIdSchema = z.string().uuid("Geçersiz teklif kimliği.");
export const exchangeListingIdSchema = z.string().uuid("Geçersiz ilan kimliği.");

export const createExchangeOfferSchema = z.object({
  listingId: exchangeListingIdSchema,
  targetListingId: z.preprocess(
    emptyToNull,
    z.string().uuid("Geçersiz takas ilanı kimliği.").nullable().optional(),
  ),
  targetCarDesc: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(10, "Araç açıklaması en az 10 karakter olmalıdır.")
      .max(1500, "Araç açıklaması en fazla 1500 karakter olabilir."),
  ),
  targetPrice: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .number({
        invalid_type_error: "Takas araç değeri sayısal olmalıdır.",
      })
      .finite("Takas araç değeri geçerli bir sayı olmalıdır.")
      .min(0, "Takas araç değeri negatif olamaz.")
      .max(1_000_000_000, "Takas araç değeri çok yüksek görünüyor.")
      .optional(),
  ),
  targetBrand: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(80, "Marka en fazla 80 karakter olabilir.").optional(),
  ),
  targetModel: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120, "Model en fazla 120 karakter olabilir.").optional(),
  ),
  targetYear: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .number({
        invalid_type_error: "Model yılı sayısal olmalıdır.",
      })
      .int("Model yılı tam sayı olmalıdır.")
      .min(1950, "Model yılı 1950'den küçük olamaz.")
      .max(currentYear, `Model yılı en fazla ${currentYear} olabilir.`)
      .optional(),
  ),
  targetMileage: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .number({
        invalid_type_error: "Kilometre sayısal olmalıdır.",
      })
      .int("Kilometre tam sayı olmalıdır.")
      .min(0, "Kilometre negatif olamaz.")
      .max(3_000_000, "Kilometre çok yüksek görünüyor.")
      .optional(),
  ),
  notes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, "Notlar en fazla 1000 karakter olabilir.").optional(),
  ),
});

export const respondToExchangeOfferSchema = z.object({
  offerId: exchangeOfferIdSchema,
  response: z.enum(["accepted", "rejected"], {
    errorMap: () => ({ message: "Geçersiz teklif yanıtı." }),
  }),
});

export type CreateExchangeOfferSchemaInput = z.infer<typeof createExchangeOfferSchema>;
export type RespondToExchangeOfferSchemaInput = z.infer<typeof respondToExchangeOfferSchema>;
</write_file>

<write_file path="src/features/exchange/services/exchange/exchange-offer-logic.ts">
import type {
  ExchangeOfferResponse,
  ExchangeOfferRow,
  ExchangeOfferStatus,
} from "./exchange-offer.types";

export const DEFAULT_EXCHANGE_OFFER_EXPIRY_HOURS = 72;

export class ExchangeOfferRuleError extends Error {
  code:
    | "SELF_OFFER"
    | "ALREADY_RESPONDED"
    | "EXPIRED"
    | "INVALID_TRANSITION"
    | "OPERATION_FAILED";

  constructor(
    code:
      | "SELF_OFFER"
      | "ALREADY_RESPONDED"
      | "EXPIRED"
      | "INVALID_TRANSITION"
      | "OPERATION_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "ExchangeOfferRuleError";
    this.code = code;
  }
}

export function buildOfferExpiryDate(
  now = new Date(),
  hours = DEFAULT_EXCHANGE_OFFER_EXPIRY_HOURS,
): string {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isOfferExpired(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function assertCanCreateExchangeOffer(params: {
  listingSellerId: string;
  currentUserId: string;
}) {
  if (params.listingSellerId === params.currentUserId) {
    throw new ExchangeOfferRuleError(
      "SELF_OFFER",
      "Kendi ilanınıza takas teklifi yapamazsınız.",
    );
  }
}

export function isRespondableStatus(status: ExchangeOfferStatus): boolean {
  return status === "pending";
}

export function assertValidExchangeTransition(
  currentStatus: ExchangeOfferStatus,
  response: ExchangeOfferResponse,
) {
  if (!isRespondableStatus(currentStatus)) {
    throw new ExchangeOfferRuleError(
      "ALREADY_RESPONDED",
      "Bu teklif zaten yanıtlandı.",
    );
  }

  if (response !== "accepted" && response !== "rejected") {
    throw new ExchangeOfferRuleError(
      "INVALID_TRANSITION",
      "Geçersiz teklif yanıtı.",
    );
  }
}

export function assertCanRespondToOffer(
  offer: Pick<ExchangeOfferRow, "status" | "expires_at">,
  response: ExchangeOfferResponse,
  now = new Date(),
) {
  assertValidExchangeTransition(offer.status, response);

  if (isOfferExpired(offer.expires_at, now)) {
    throw new ExchangeOfferRuleError("EXPIRED", "Bu teklifin süresi dolmuş.");
  }
}

export function resolveFailedResponseMutationMessage(
  offer: Pick<ExchangeOfferRow, "status" | "expires_at"> | null,
  now = new Date(),
): never {
  if (!offer) {
    throw new ExchangeOfferRuleError("OPERATION_FAILED", "Teklif işlenemedi.");
  }

  if (offer.status !== "pending") {
    throw new ExchangeOfferRuleError(
      "ALREADY_RESPONDED",
      "Bu teklif zaten yanıtlandı.",
    );
  }

  if (isOfferExpired(offer.expires_at, now)) {
    throw new ExchangeOfferRuleError("EXPIRED", "Bu teklifin süresi dolmuş.");
  }

  throw new ExchangeOfferRuleError(
    "OPERATION_FAILED",
    "Teklif şu anda işlenemiyor. Lütfen tekrar deneyin.",
  );
}
</write_file>

<write_file path="src/features/exchange/services/exchange/exchange-offer-records.ts">
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";
import type {
  ExchangeListingOwnershipRow,
  ExchangeOfferListingSummary,
  ExchangeOfferResponse,
  ExchangeOfferRow,
  IncomingExchangeOffer,
  OutgoingExchangeOffer,
} from "./exchange-offer.types";

type ExchangeSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const EXCHANGE_OFFER_COLUMNS = `
  id,
  listing_id,
  offerer_id,
  target_listing_id,
  target_car_desc,
  target_price,
  target_brand,
  target_model,
  target_year,
  target_mileage,
  notes,
  status,
  expires_at,
  created_at,
  updated_at
`;

const EXCHANGE_OFFER_WITH_LISTING_COLUMNS = `
  ${EXCHANGE_OFFER_COLUMNS},
  listing:listings!inner(
    id,
    title,
    slug
  )
`;

interface RawOfferWithListing extends ExchangeOfferRow {
  listing: ExchangeOfferListingSummary | null;
}

function mapOfferWithListing<T extends RawOfferWithListing>(
  row: T,
): T & { listing: ExchangeOfferListingSummary | null } {
  return {
    ...row,
    listing: row.listing
      ? {
          id: row.listing.id,
          title: row.listing.title,
          slug: row.listing.slug,
        }
      : null,
  };
}

export async function findListingOwnershipById(
  supabase: ExchangeSupabaseClient,
  listingId: string,
): Promise<ExchangeListingOwnershipRow | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    logger.db.error("findListingOwnershipById failed", error, { listingId });
    throw error;
  }

  return data;
}

export async function findOfferById(
  supabase: ExchangeSupabaseClient,
  offerId: string,
): Promise<ExchangeOfferRow | null> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_COLUMNS)
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    logger.db.error("findOfferById failed", error, { offerId });
    throw error;
  }

  return data;
}

export async function findOfferStatusById(
  supabase: ExchangeSupabaseClient,
  offerId: string,
): Promise<Pick<ExchangeOfferRow, "status" | "expires_at"> | null> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select("status, expires_at")
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    logger.db.error("findOfferStatusById failed", error, { offerId });
    throw error;
  }

  return data;
}

export async function listIncomingExchangeOffersForSeller(
  supabase: ExchangeSupabaseClient,
  sellerId: string,
): Promise<IncomingExchangeOffer[]> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_WITH_LISTING_COLUMNS)
    .eq("listing.seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("listIncomingExchangeOffersForSeller failed", error, { sellerId });
    throw error;
  }

  return (data ?? []).map((row) =>
    mapOfferWithListing(row as RawOfferWithListing),
  ) as IncomingExchangeOffer[];
}

export async function listIncomingExchangeOffersForListingAndSeller(
  supabase: ExchangeSupabaseClient,
  params: { listingId: string; sellerId: string },
): Promise<IncomingExchangeOffer[]> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_WITH_LISTING_COLUMNS)
    .eq("listing_id", params.listingId)
    .eq("listing.seller_id", params.sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("listIncomingExchangeOffersForListingAndSeller failed", error, params);
    throw error;
  }

  return (data ?? []).map((row) =>
    mapOfferWithListing(row as RawOfferWithListing),
  ) as IncomingExchangeOffer[];
}

export async function listOutgoingPendingExchangeOffersForOfferer(
  supabase: ExchangeSupabaseClient,
  offererId: string,
): Promise<OutgoingExchangeOffer[]> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_WITH_LISTING_COLUMNS)
    .eq("offerer_id", offererId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("listOutgoingPendingExchangeOffersForOfferer failed", error, {
      offererId,
    });
    throw error;
  }

  return (data ?? []).map((row) =>
    mapOfferWithListing(row as RawOfferWithListing),
  ) as OutgoingExchangeOffer[];
}

export async function insertExchangeOffer(
  supabase: ExchangeSupabaseClient,
  payload: {
    listing_id: string;
    offerer_id: string;
    target_listing_id: string | null;
    target_car_desc: string;
    target_price: number | null;
    target_brand: string | null;
    target_model: string | null;
    target_year: number | null;
    target_mileage: number | null;
    notes: string | null;
    expires_at: string;
  },
): Promise<Pick<ExchangeOfferRow, "id" | "status" | "expires_at">> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .insert(payload)
    .select("id, status, expires_at")
    .single();

  if (error) {
    logger.db.error("insertExchangeOffer failed", error, {
      listingId: payload.listing_id,
      offererId: payload.offerer_id,
    });
    throw error;
  }

  return data;
}

export async function updateOfferStatusIfPendingAndUnexpired(
  supabase: ExchangeSupabaseClient,
  params: {
    offerId: string;
    response: ExchangeOfferResponse;
    nowIso: string;
  },
): Promise<Pick<ExchangeOfferRow, "id" | "status" | "expires_at"> | null> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .update({
      status: params.response,
    })
    .eq("id", params.offerId)
    .eq("status", "pending")
    .or(`expires_at.is.null,expires_at.gt.${params.nowIso}`)
    .select("id, status, expires_at")
    .maybeSingle();

  if (error) {
    logger.db.error("updateOfferStatusIfPendingAndUnexpired failed", error, params);
    throw error;
  }

  return data;
}
</write_file>

<write_file path="src/features/exchange/services/exchange/exchange-offer-actions.ts">
"use server";

import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";
import {
  buildOfferExpiryDate,
  assertCanCreateExchangeOffer,
  assertCanRespondToOffer,
  ExchangeOfferRuleError,
  resolveFailedResponseMutationMessage,
} from "./exchange-offer-logic";
import {
  findListingOwnershipById,
  findOfferById,
  findOfferStatusById,
  insertExchangeOffer,
  listIncomingExchangeOffersForListingAndSeller,
  listIncomingExchangeOffersForSeller,
  listOutgoingPendingExchangeOffersForOfferer,
  updateOfferStatusIfPendingAndUnexpired,
} from "./exchange-offer-records";
import {
  createExchangeOfferSchema,
  exchangeListingIdSchema,
  respondToExchangeOfferSchema,
} from "./exchange-offer.schema";
import type {
  CreateExchangeOfferInput,
  ExchangeActionError,
  ExchangeActionResult,
  ExchangeOfferListResult,
  ExchangeOfferMutationResult,
  RespondToExchangeOfferInput,
} from "./exchange-offer.types";

function mapZodError(error: ZodError): ExchangeActionError {
  const flattened = error.flatten();

  return {
    code: "VALIDATION_ERROR",
    message: "Form alanlarını kontrol edin.",
    fieldErrors: flattened.fieldErrors,
  };
}

function mapKnownError(error: unknown): ExchangeActionError {
  if (error instanceof ZodError) {
    return mapZodError(error);
  }

  if (error instanceof ExchangeOfferRuleError) {
    if (error.code === "SELF_OFFER") {
      return { code: "SELF_OFFER", message: error.message };
    }

    if (error.code === "ALREADY_RESPONDED") {
      return { code: "ALREADY_RESPONDED", message: error.message };
    }

    if (error.code === "EXPIRED") {
      return { code: "EXPIRED", message: error.message };
    }

    return { code: "OPERATION_FAILED", message: error.message };
  }

  if (error instanceof Error) {
    return { code: "DB_ERROR", message: error.message };
  }

  return {
    code: "OPERATION_FAILED",
    message: "İşlem sırasında beklenmeyen bir hata oluştu.",
  };
}

async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
    };
  }

  return {
    supabase,
    user,
  };
}

export async function createExchangeOfferAction(
  input: CreateExchangeOfferInput,
): Promise<ExchangeActionResult<ExchangeOfferMutationResult>> {
  try {
    const parsed = createExchangeOfferSchema.parse(input);
    const { supabase, user } = await requireAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Giriş yapmalısınız.",
        },
      };
    }

    const listing = await findListingOwnershipById(supabase, parsed.listingId);

    if (!listing) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "İlan bulunamadı.",
        },
      };
    }

    assertCanCreateExchangeOffer({
      listingSellerId: listing.seller_id,
      currentUserId: user.id,
    });

    const expiresAt = buildOfferExpiryDate();

    const created = await insertExchangeOffer(supabase, {
      listing_id: parsed.listingId,
      offerer_id: user.id,
      target_listing_id: parsed.targetListingId ?? null,
      target_car_desc: parsed.targetCarDesc,
      target_price: parsed.targetPrice ?? null,
      target_brand: parsed.targetBrand ?? null,
      target_model: parsed.targetModel ?? null,
      target_year: parsed.targetYear ?? null,
      target_mileage: parsed.targetMileage ?? null,
      notes: parsed.notes ?? null,
      expires_at: expiresAt,
    });

    return {
      ok: true,
      data: {
        offerId: created.id,
        status: created.status,
        expiresAt: created.expires_at,
      },
    };
  } catch (error) {
    logger.db.error("createExchangeOfferAction failed", error, { input });
    return {
      ok: false,
      error: mapKnownError(error),
    };
  }
}

export async function respondToExchangeOfferAction(
  input: RespondToExchangeOfferInput,
): Promise<ExchangeActionResult<ExchangeOfferMutationResult>> {
  try {
    const parsed = respondToExchangeOfferSchema.parse(input);
    const { supabase, user } = await requireAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Giriş yapmalısınız.",
        },
      };
    }

    const offer = await findOfferById(supabase, parsed.offerId);

    if (!offer) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Teklif bulunamadı.",
        },
      };
    }

    assertCanRespondToOffer(offer, parsed.response);

    const listing = await findListingOwnershipById(supabase, offer.listing_id);

    if (!listing) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "İlan bulunamadı.",
        },
      };
    }

    if (listing.seller_id !== user.id) {
      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Bu teklifi yanıtlama yetkiniz yok.",
        },
      };
    }

    const nowIso = new Date().toISOString();
    const updated = await updateOfferStatusIfPendingAndUnexpired(supabase, {
      offerId: parsed.offerId,
      response: parsed.response,
      nowIso,
    });

    if (!updated) {
      const currentState = await findOfferStatusById(supabase, parsed.offerId);

      if (!currentState) {
        return {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Teklif bulunamadı.",
          },
        };
      }

      resolveFailedResponseMutationMessage(currentState);
    }

    return {
      ok: true,
      data: {
        offerId: updated.id,
        status: updated.status,
        expiresAt: updated.expires_at,
      },
    };
  } catch (error) {
    logger.db.error("respondToExchangeOfferAction failed", error, { input });
    return {
      ok: false,
      error: mapKnownError(error),
    };
  }
}

export async function getMyIncomingExchangeOffersAction(): Promise<
  ExchangeActionResult<ExchangeOfferListResult>
> {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Giriş yapmalısınız.",
        },
      };
    }

    const offers = await listIncomingExchangeOffersForSeller(supabase, user.id);

    return {
      ok: true,
      data: { offers },
    };
  } catch (error) {
    logger.db.error("getMyIncomingExchangeOffersAction failed", error);
    return {
      ok: false,
      error: mapKnownError(error),
    };
  }
}

export async function getMyIncomingExchangeOffersForListingAction(
  listingId: string,
): Promise<ExchangeActionResult<ExchangeOfferListResult>> {
  try {
    const parsedListingId = exchangeListingIdSchema.parse(listingId);
    const { supabase, user } = await requireAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Giriş yapmalısınız.",
        },
      };
    }

    const listing = await findListingOwnershipById(supabase, parsedListingId);

    if (!listing) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "İlan bulunamadı.",
        },
      };
    }

    if (listing.seller_id !== user.id) {
      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Bu ilana ait teklifleri görüntüleme yetkiniz yok.",
        },
      };
    }

    const offers = await listIncomingExchangeOffersForListingAndSeller(supabase, {
      listingId: parsedListingId,
      sellerId: user.id,
    });

    return {
      ok: true,
      data: { offers },
    };
  } catch (error) {
    logger.db.error("getMyIncomingExchangeOffersForListingAction failed", error, {
      listingId,
    });
    return {
      ok: false,
      error: mapKnownError(error),
    };
  }
}

export async function getMyOutgoingPendingExchangeOffersAction(
  offererId?: string,
): Promise<ExchangeActionResult<ExchangeOfferListResult>> {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Giriş yapmalısınız.",
        },
      };
    }

    if (offererId && offererId !== user.id) {
      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Bu teklifleri görüntüleme yetkiniz yok.",
        },
      };
    }

    const offers = await listOutgoingPendingExchangeOffersForOfferer(
      supabase,
      user.id,
    );

    return {
      ok: true,
      data: { offers },
    };
  } catch (error) {
    logger.db.error("getMyOutgoingPendingExchangeOffersAction failed", error, {
      offererId,
    });
    return {
      ok: false,
      error: mapKnownError(error),
    };
  }
}
</write_file>

<write_file path="src/features/exchange/services/exchange/exchange-offers.ts">
import {
  createExchangeOfferAction,
  getMyIncomingExchangeOffersAction,
  getMyIncomingExchangeOffersForListingAction,
  getMyOutgoingPendingExchangeOffersAction,
  respondToExchangeOfferAction,
} from "./exchange-offer-actions";

export type {
  CreateExchangeOfferInput,
  ExchangeActionError,
  ExchangeActionResult,
  ExchangeOfferListResult,
  ExchangeOfferMutationResult,
  ExchangeOfferResponse,
  ExchangeOfferRow as ExchangeOffer,
  ExchangeOfferStatus,
  IncomingExchangeOffer,
  OutgoingExchangeOffer,
  RespondToExchangeOfferInput,
} from "./exchange-offer.types";

export {
  createExchangeOfferAction,
  getMyIncomingExchangeOffersAction,
  getMyIncomingExchangeOffersForListingAction,
  getMyOutgoingPendingExchangeOffersAction,
  respondToExchangeOfferAction,
};

export async function createExchangeOffer(params: {
  listingId: string;
  targetListingId?: string | null;
  targetCarDesc: string;
  targetPrice?: number | null;
  targetBrand?: string | null;
  targetModel?: string | null;
  targetYear?: number | null;
  targetMileage?: number | null;
  notes?: string | null;
}) {
  const result = await createExchangeOfferAction(params);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return { ok: true };
}

export async function respondToExchangeOffer(
  offerId: string,
  response: "accepted" | "rejected",
) {
  const result = await respondToExchangeOfferAction({ offerId, response });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return { ok: true };
}

export async function getExchangeOffersForListing(listingId: string) {
  const result = await getMyIncomingExchangeOffersForListingAction(listingId);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data.offers;
}

export async function getPendingExchangesByOfferer(offererId: string) {
  const result = await getMyOutgoingPendingExchangeOffersAction(offererId);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data.offers;
}
</write_file>

Bu yapı ile:

- records / logic / actions ayrımı canonical hale gelir
- read path’ler auth ve ownership ile fail-closed olur
- `pending` isim/davranış uyumsuzluğu kapanır
- false-positive response bug’ı kapanır
- expiry kontrolü update aşamasında da uygulanır
- Zod ile server-side contract netleşir
- join’li read sonucu ayrı tiplerle güvenli hale gelir
- eski import path’i için uyumluluk katmanı korunur

İstersen bir sonraki adımda buna uygun React Hook Form kullanım kontratını ve UI’daki toast/inline error eşlemesini de aynı standarda göre çıkarabilirim.