import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withAdminRoute } from "@/features/shared/lib/security";
import { captureServerError, captureServerEvent } from "@/features/shared/lib/telemetry-server";

export async function POST(request: Request) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  try {
    revalidatePath("/", "layout");
    revalidatePath("/listings", "page");
    revalidatePath("/admin", "page");

    captureServerEvent(
      "admin_cache_cleared",
      {
        adminUserId: adminUser.id,
      },
      adminUser.id
    );

    return NextResponse.json({ success: true, message: "Önbellek başarıyla temizlendi." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    captureServerError(
      "Admin cache clear failed",
      "admin",
      error,
      {
        adminUserId: adminUser.id,
      },
      adminUser.id
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
