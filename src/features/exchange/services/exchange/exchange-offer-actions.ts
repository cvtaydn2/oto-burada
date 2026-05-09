"use server";

import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

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
import {
  assertCanCreateExchangeOffer,
  assertCanRespondToOffer,
  buildOfferExpiryDate,
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
  input: CreateExchangeOfferInput
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
  input: RespondToExchangeOfferInput
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

    // Add defensive check since resolveFailedResponseMutationMessage returns 'never', but Typescript might still consider it reachable.
    if (!updated) {
      throw new Error("Teklif güncellenemedi.");
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
  listingId: string
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
  offererId?: string
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

    const offers = await listOutgoingPendingExchangeOffersForOfferer(supabase, user.id);

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
