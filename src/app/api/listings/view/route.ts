import { NextResponse } from "next/server";
import { z } from "zod";

import { withCsrfToken } from "@/lib/api/security";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/logging/logger";
import { recordListingView } from "@/services/listings/listing-views";
import { getListingById } from "@/services/listings/marketplace-listings";

const viewSchema = z.object({
  listingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const security = await withCsrfToken(request);
  if (!security.ok) return security.response;

  try {
    const body = await request.json();
    const validated = viewSchema.parse(body);

    const listing = await getListingById(validated.listingId);
    if (!listing || listing.status !== "approved") {
      return NextResponse.json({ error: "Listing not available" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    const headersList = request.headers;
    const viewerIp =
      headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;

    recordListingView(validated.listingId, {
      viewerId: currentUser?.id,
      viewerIp,
    }).catch((error) => {
      logger.listings.error("Listing view recording failed", error, {
        listingId: validated.listingId,
        viewerIp,
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
