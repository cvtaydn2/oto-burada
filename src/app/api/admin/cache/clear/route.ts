import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withAdminRoute } from "@/lib/api/security";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function POST(request: Request) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const authResponse = security.user!;

  try {
    revalidatePath("/", "layout");
    revalidatePath("/listings", "page");
    revalidatePath("/admin", "page");

    captureServerEvent(
      "admin_cache_cleared",
      {
        adminUserId: authResponse.id,
      },
      authResponse.id
    );

    return NextResponse.json({ success: true, message: "Önbellek başarıyla temizlendi." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    captureServerError(
      "Admin cache clear failed",
      "admin",
      error,
      {
        adminUserId: authResponse.id,
      },
      authResponse.id
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
