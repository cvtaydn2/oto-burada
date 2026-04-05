import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import {
  buildPendingListing,
  listingSubmissionsCookieName,
  listingSubmissionsCookieOptions,
  parseStoredListings,
  serializeStoredListings,
} from "@/services/listings/listing-submissions";

function issuesToFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<Record<string, string>>((fieldErrors, issue) => {
    const path = issue.path.join(".");

    if (!path || fieldErrors[path]) {
      return fieldErrors;
    }

    fieldErrors[path] = issue.message;
    return fieldErrors;
  }, {});
}

export async function POST(request: Request) {
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

  const normalizedInput = {
    ...parsedFormValues.data,
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

  const cookieStore = await cookies();
  const existingListings = parseStoredListings(
    cookieStore.get(listingSubmissionsCookieName)?.value,
  );

  const createdListing = buildPendingListing(parsedListingInput.data, user.id, existingListings);
  const response = NextResponse.json({
    message: "İlanın kaydedildi ve moderasyon incelemesine gönderildi.",
    listing: {
      id: createdListing.id,
      slug: createdListing.slug,
      status: createdListing.status,
      title: createdListing.title,
    },
  });

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings([createdListing, ...existingListings]),
    listingSubmissionsCookieOptions,
  );

  return response;
}
