import { NextResponse } from "next/server";
import { z } from "zod";

import { withSecurity } from "@/lib/api/security";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/logging/logger";
import { recordListingView } from "@/services/listings/listing-views";

const viewSchema = z.object({
  listingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const security = await withSecurity(request);
  if (!security.ok) return security.response;

  try {
    const body = await request.json();
    const validated = viewSchema.parse(body);

    const currentUser = await getCurrentUser();
    const headersList = request.headers;
    const viewerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

    // Fire and forget recording
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
