import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveStoredListing,
  archiveDatabaseListing,
  findArchivableListingById,
  listingSubmissionsCookieName,
  listingSubmissionsCookieOptions,
  parseStoredListings,
  replaceStoredListing,
  serializeStoredListings,
} from "@/services/listings/listing-submissions";

export async function POST(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase ortam degiskenleri eksik. Ilan arsivlemek icin .env.local dosyasini tamamlamalisin.",
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

  const archivableListing = await findArchivableListingById(listingId, user.id);

  if (!archivableListing) {
    return NextResponse.json(
      { message: "Arsivlenecek ilan bulunamadi." },
      { status: 404 },
    );
  }

  const persistedListing = await archiveDatabaseListing(listingId);

  if (persistedListing) {
    return NextResponse.json({
      listing: {
        id: persistedListing.id,
        status: persistedListing.status,
      },
      message: "Ilan arsive alindi.",
    });
  }

  const archivedListing = archiveStoredListing(archivableListing);
  const cookieStore = await cookies();
  const cookieListings = parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value);

  const response = NextResponse.json({
    listing: {
      id: archivedListing.id,
      status: archivedListing.status,
    },
    message: "Ilan arsive alindi.",
  });

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings(replaceStoredListing(cookieListings, archivedListing)),
    listingSubmissionsCookieOptions,
  );

  return response;
}
