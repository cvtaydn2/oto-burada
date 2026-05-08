import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/lib/session";
import { recordListingView } from "@/features/marketplace/services/listing-views";
import { getListingById } from "@/features/marketplace/services/marketplace-listings";
import { logger } from "@/lib/logger";
import { withSecurity } from "@/lib/security";

const viewSchema = z.object({
  listingId: z.string().uuid(),
});

export async function POST(request: Request) {
  // Public endpoint: require same-origin check but do not require synchronizer CSRF token.
  // This avoids false 403s from stale client token while still blocking cross-site posts.
  const security = await withSecurity(request, {
    requireCsrf: true,
  });
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
