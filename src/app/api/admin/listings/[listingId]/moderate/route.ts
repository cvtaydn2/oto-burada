import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/session";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import {
  moderateDatabaseListing,
} from "@/services/listings/listing-submissions";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { checkRateLimit } from "@/lib/utils/rate-limit-middleware";
import { headers } from "next/headers";
import { sanitizeText } from "@/lib/utils/sanitize";

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const ipRateLimit = checkRateLimit(`admin:moderate:${getClientIp()}`, rateLimitProfiles.adminModerate);

  if (!ipRateLimit.allowed) {
    return NextResponse.json(
      { message: "Cok fazla moderasyon istegi. Lutfen bekle." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const adminUser = await requireAdminUser();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Moderasyon istegi okunamadi." }, { status: 400 });
  }

  const action =
    typeof body === "object" && body !== null && "action" in body ? String(body.action ?? "") : "";
  const rawNote =
    typeof body === "object" && body !== null && "note" in body ? String(body.note ?? "").trim() : "";
  const note = rawNote ? sanitizeText(rawNote) : "";

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ message: "Gecersiz moderasyon aksiyonu." }, { status: 400 });
  }

  if (note.length > 0 && note.length < 3) {
    return NextResponse.json(
      { message: "Moderasyon notu girersen en az 3 karakter olmali." },
      { status: 400 },
    );
  }

  const { listingId } = await context.params;
  const persistedListing = await moderateDatabaseListing(
    listingId,
    action === "approve" ? "approved" : "rejected",
  );

  if (!persistedListing) {
    return NextResponse.json({ message: "Incelenecek ilan bulunamadi." }, { status: 404 });
  }

  await createAdminModerationAction({
    action: action === "approve" ? "approve" : "reject",
    adminUserId: adminUser.id,
    note:
      note ||
      (action === "approve"
        ? `${persistedListing.title} ilani onaylandi.`
        : `${persistedListing.title} ilani reddedildi.`),
    targetId: persistedListing.id,
    targetType: "listing",
  });

  return NextResponse.json({
    listing: {
      id: persistedListing.id,
      status: persistedListing.status,
    },
    message: action === "approve" ? "Ilan onaylandi." : "Ilan reddedildi.",
  });
}

