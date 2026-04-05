import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import {
  buildUpdatedListing,
  getEditableListingById,
  listingSubmissionsCookieName,
  listingSubmissionsCookieOptions,
  parseStoredListings,
  replaceStoredListing,
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase ortam degiskenleri eksik. Ilan guncellemek icin .env.local dosyasini tamamlamalisin.",
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Gonderilen form verisi okunamadi. Lutfen tekrar dene." },
      { status: 400 },
    );
  }

  const parsedFormValues = listingCreateFormSchema.safeParse(body);

  if (!parsedFormValues.success) {
    return NextResponse.json(
      {
        message: parsedFormValues.error.issues[0]?.message ?? "Form alanlarini kontrol et.",
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
      { message: "Oturum dogrulanamadi. Lutfen tekrar giris yap." },
      { status: 401 },
    );
  }

  const { listingId } = await context.params;
  const cookieStore = await cookies();
  const existingListings = parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value);
  const existingListing = getEditableListingById(existingListings, listingId, user.id);

  if (!existingListing) {
    return NextResponse.json(
      { message: "Duzenlenebilir ilan bulunamadi." },
      { status: 404 },
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
        message: parsedListingInput.error.issues[0]?.message ?? "Ilan bilgileri dogrulanamadi.",
        fieldErrors: issuesToFieldErrors(parsedListingInput.error.issues),
      },
      { status: 400 },
    );
  }

  const updatedListing = buildUpdatedListing(
    parsedListingInput.data,
    existingListing,
    existingListings,
  );
  const response = NextResponse.json({
    listing: {
      id: updatedListing.id,
      slug: updatedListing.slug,
      status: updatedListing.status,
      title: updatedListing.title,
    },
    message: "Ilan bilgilerin guncellendi.",
  });

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings(replaceStoredListing(existingListings, updatedListing)),
    listingSubmissionsCookieOptions,
  );

  return response;
}
