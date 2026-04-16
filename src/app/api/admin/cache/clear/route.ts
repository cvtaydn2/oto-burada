import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { revalidatePath } from "next/cache";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function POST() {
  const authResponse = await requireApiAdminUser();
  if (authResponse instanceof Response) return authResponse;

  try {
    revalidatePath("/", "layout");
    revalidatePath("/listings", "page");
    revalidatePath("/admin", "page");

    captureServerEvent("admin_cache_cleared", {
      adminUserId: authResponse.id,
    }, authResponse.id);

    return NextResponse.json({ success: true, message: "Önbellek başarıyla temizlendi." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    captureServerError("Admin cache clear failed", "admin", error, {
      adminUserId: authResponse.id,
    }, authResponse.id);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
