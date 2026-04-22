import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { withSecurity } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { recordListingView } from "@/services/listings/listing-views";

export async function POST(request: Request) {
  const security = await withSecurity(request);
  if (!security.ok) return security.response;

  try {
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const headersList = request.headers;
    const viewerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

    // Fire and forget recording
    recordListingView(listingId, {
      viewerId: currentUser?.id,
      viewerIp,
    }).catch((error) => {
      logger.listings.error("Listing view recording failed", error, { listingId, viewerIp });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
