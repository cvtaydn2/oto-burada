import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { revalidatePath } from "next/cache";

export async function POST() {
  const authResponse = await requireApiAdminUser();
  if (authResponse instanceof Response) return authResponse;

  try {
    // Revalidate all major public paths
    revalidatePath("/", "layout");
    revalidatePath("/listings", "page");
    revalidatePath("/admin", "page");

    return NextResponse.json({ success: true, message: "Önbellek başarıyla temizlendi." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
