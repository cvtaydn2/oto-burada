import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

import { exampleListings } from "@/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import {
  buildPendingListing,
  createDatabaseListing,
} from "@/services/listings/listing-submissions";
import { ensureProfileRecord } from "@/services/profile/profile-records";

export async function POST(request: Request) {
  const ipRateLimit = enforceRateLimit(
    getRateLimitKey(request, "api:listings:create"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase ortam değişkenleri eksik. İlan oluşturmak için .env.local dosyasını tamamlamalısın.",
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Gönderilen form verisi okunamadı. Lütfen tekrar dene." },
      { status: 400 },
    );
  }

  const parsedFormValues = listingCreateFormSchema.safeParse(body);

  if (!parsedFormValues.success) {
    return NextResponse.json(
      {
        message: parsedFormValues.error.issues[0]?.message ?? "Form alanlarını kontrol et.",
        fieldErrors: issuesToFieldErrors(parsedFormValues.error.issues),
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { message: "Oturum doğrulanamadı. Lütfen tekrar giriş yap." },
      { status: 401 },
    );
  }

  const userRateLimit = enforceRateLimit(
    getUserRateLimitKey(user.id, "listings:create"),
    rateLimitProfiles.listingCreate,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  const normalizedInput = {
    ...parsedFormValues.data,
    title: sanitizeText(parsedFormValues.data.title),
    description: sanitizeDescription(parsedFormValues.data.description),
    images: parsedFormValues.data.images
      .filter(
        (image) =>
          (image.url ?? "").trim().length > 0 &&
          (image.storagePath ?? "").trim().length > 0,
      )
      .map((image, index) => ({
        storagePath: image.storagePath?.trim() ?? "",
        url: image.url?.trim() ?? "",
        order: index,
        isCover: index === 0,
      })),
  };

  const parsedListingInput = listingCreateSchema.safeParse(normalizedInput);

  if (!parsedListingInput.success) {
    return NextResponse.json(
      {
        message: parsedListingInput.error.issues[0]?.message ?? "İlan bilgileri doğrulanamadı.",
        fieldErrors: issuesToFieldErrors(parsedListingInput.error.issues),
      },
      { status: 400 },
    );
  }

  await ensureProfileRecord(user);

  const createdListing = buildPendingListing(parsedListingInput.data, user.id, [
    ...exampleListings,
  ]);
  const persistedListing = await createDatabaseListing(createdListing);

  if (persistedListing) {
    return NextResponse.json({
      message: "İlanın kaydedildi ve moderasyon incelemesine gönderildi.",
      listing: {
        id: persistedListing.id,
        slug: persistedListing.slug,
        status: persistedListing.status,
        title: persistedListing.title,
      },
    });
  }

  return NextResponse.json(
    { message: "İlan kaydedilemedi. Lütfen tekrar dene." },
    { status: 500 },
  );
}
