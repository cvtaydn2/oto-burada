import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveStoredListing,
  getArchivableListingById,
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
  const cookieStore = await cookies();
  const existingListings = parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value);
  const existingListing = getArchivableListingById(existingListings, listingId, user.id);

  if (!existingListing) {
    return NextResponse.json(
      { message: "Arsivlenecek ilan bulunamadi." },
      { status: 404 },
    );
  }

  const archivedListing = archiveStoredListing(existingListing);
  const response = NextResponse.json({
    listing: {
      id: archivedListing.id,
      status: archivedListing.status,
    },
    message: "Ilan arsive alindi.",
  });

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings(replaceStoredListing(existingListings, archivedListing)),
    listingSubmissionsCookieOptions,
  );

  return response;
}
