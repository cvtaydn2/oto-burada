import { cookies } from "next/headers";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
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
    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Supabase ortam değişkenleri eksik. İlan arşivlemek için .env.local dosyasını tamamlamalısın.",
      503,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı. Lütfen tekrar giriş yap.", 401);
  }

  const { listingId } = await context.params;

  const archivableListing = await findArchivableListingById(listingId, user.id);

  if (!archivableListing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Arşivlenecek ilan bulunamadı.", 404);
  }

  const persistedListing = await archiveDatabaseListing(listingId);

  if (persistedListing) {
    return apiSuccess(
      {
        listing: {
          id: persistedListing.id,
          status: persistedListing.status,
        },
      },
      "İlan arşive alındı.",
    );
  }

  const archivedListing = archiveStoredListing(archivableListing);
  const cookieStore = await cookies();
  const cookieListings = parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value);

  const response = apiSuccess(
    {
      listing: {
        id: archivedListing.id,
        status: archivedListing.status,
      },
    },
    "İlan arşive alındı.",
  );

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings(replaceStoredListing(cookieListings, archivedListing)),
    listingSubmissionsCookieOptions,
  );

  return response;
}
