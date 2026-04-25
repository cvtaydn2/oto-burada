import { NextResponse } from "next/server";
import { z } from "zod";

import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { withAdminRoute } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";

const banSchema = z.object({
  ip: z.string().refine((val) => {
    // IPv4 or IPv6 validation
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(val) || ipv6Regex.test(val);
  }, "Invalid IP address"),
  reason: z.string().min(5).max(500),
});

export async function POST(request: Request) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const user = security.user!;

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

  // Validate IP format
  try {
    banSchema.parse({ ip, reason });
  } catch (error) {
    return NextResponse.json({ error: "Invalid IP address or reason" }, { status: 400 });
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
