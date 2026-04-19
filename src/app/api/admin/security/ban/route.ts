import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { logger } from "@/lib/utils/logger";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function POST(request: Request) {
  // 1. Auth check — only admins can ban IPs
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // 2. Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const ip = formData.get("ip") as string | null;
  const reason = formData.get("reason") as string | null;

  if (!ip || !reason) {
    return NextResponse.json({ error: "Missing ip or reason" }, { status: 400 });
  }

  // 3. Insert into banlist
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("ip_banlist").insert({
      ip_address: ip,
      reason,
      banned_by: user.id,
      banned_at: new Date().toISOString(),
      expires_at: null, // Permanent ban
    });

    if (error) {
      // Duplicate key error (IP already banned)
      if (error.code === "23505") {
        logger.admin.warn("IP already banned", { ip, adminId: user.id });
        return NextResponse.redirect(new URL("/admin/security", request.url));
      }
      throw error;
    }

    logger.admin.info("IP banned", { ip, reason, adminId: user.id });
    captureServerEvent("ip_banned", { ip, reason }, user.id);

    // Redirect back to security page
    return NextResponse.redirect(new URL("/admin/security", request.url));
  } catch (error) {
    logger.admin.error("Failed to ban IP", error, { ip, adminId: user.id });
    return NextResponse.json({ error: "Failed to ban IP" }, { status: 500 });
  }
}
