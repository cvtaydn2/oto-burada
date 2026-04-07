import { NextResponse } from "next/server";

import { exampleListings } from "@/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { sanitizeText, sanitizeDescription } from "@/lib/utils/sanitize";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingCreateFormSchema, listingCreateSchema } from "@/lib/validators";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import {
  buildUpdatedListing,
  deleteDatabaseListing,
  findEditableListingById,
  getStoredListings,
  updateDatabaseListing,
} from "@/services/listings/listing-submissions";

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

  const existingListing = await findEditableListingById(listingId, user.id);

  if (!existingListing) {
    return NextResponse.json(
      { message: "Duzenlenebilir ilan bulunamadi." },
      { status: 404 },
    );
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
        message: parsedListingInput.error.issues[0]?.message ?? "Ilan bilgileri dogrulanamadi.",
        fieldErrors: issuesToFieldErrors(parsedListingInput.error.issues),
      },
      { status: 400 },
    );
  }

  const allListings = [...exampleListings, ...(await getStoredListings())];

  const updatedListing = buildUpdatedListing(
    parsedListingInput.data,
    existingListing,
    allListings,
  );
  const persistedListing = await updateDatabaseListing(updatedListing);

  if (persistedListing) {
    return NextResponse.json({
      listing: {
        id: persistedListing.id,
        slug: persistedListing.slug,
        status: persistedListing.status,
        title: persistedListing.title,
      },
      message: "Ilan bilgilerin guncellendi.",
    });
  }

  return NextResponse.json(
    { message: "Ilan kaydedilemedi. Lutfen tekrar dene." },
    { status: 500 },
  );
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase ortam degiskenleri eksik. Ilan silmek icin .env.local dosyasini tamamlamalisin.",
      },
      { status: 503 },
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
  const result = await deleteDatabaseListing(listingId, user.id);

  if (!result) {
    return NextResponse.json(
      { message: "Silinecek ilan bulunamadi. Sadece arsivlenmis ilanlar silinebilir." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "Ilan kalici olarak silindi.",
    deleted: true,
  });
}
