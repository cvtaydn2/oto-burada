import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/session";
import {
  getModeratableListingById,
  listingSubmissionsCookieName,
  listingSubmissionsCookieOptions,
  moderateStoredListing,
  parseStoredListings,
  replaceStoredListing,
  serializeStoredListings,
} from "@/services/listings/listing-submissions";

export async function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  await requireAdminUser();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Moderasyon istegi okunamadi." }, { status: 400 });
  }

  const action =
    typeof body === "object" && body !== null && "action" in body ? String(body.action ?? "") : "";

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ message: "Gecersiz moderasyon aksiyonu." }, { status: 400 });
  }

  const { listingId } = await context.params;
  const cookieStore = await cookies();
  const existingListings = parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value);
  const existingListing = getModeratableListingById(existingListings, listingId);

  if (!existingListing) {
    return NextResponse.json({ message: "Incelenecek ilan bulunamadi." }, { status: 404 });
  }

  const moderatedListing = moderateStoredListing(
    existingListing,
    action === "approve" ? "approved" : "rejected",
  );
  const response = NextResponse.json({
    listing: {
      id: moderatedListing.id,
      status: moderatedListing.status,
    },
    message: action === "approve" ? "Ilan onaylandi." : "Ilan reddedildi.",
  });

  response.cookies.set(
    listingSubmissionsCookieName,
    serializeStoredListings(replaceStoredListing(existingListings, moderatedListing)),
    listingSubmissionsCookieOptions,
  );

  return response;
}
