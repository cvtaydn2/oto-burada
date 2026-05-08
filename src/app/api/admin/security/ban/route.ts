import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withAdminRoute } from "@/lib/security";
import { captureServerEvent } from "@/lib/telemetry-server";

const banSchema = z.object({
  ip: z.string().refine((val) => {
    // IPv4 validation
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 validation (full, compressed, and IPv4-mapped formats)
    const ipv6FullRegex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    const ipv6CompressedRegex =
      /^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;
    const ipv6MixedRegex = /^([0-9a-fA-F]{1,4}:){1,7}:$/;
    const ipv4MappedRegex =
      /^::ffff:((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;

    return (
      ipv4Regex.test(val) ||
      ipv6FullRegex.test(val) ||
      ipv6CompressedRegex.test(val) ||
      ipv6MixedRegex.test(val) ||
      ipv4MappedRegex.test(val)
    );
  }, "Invalid IP address"),
  reason: z.string().min(5).max(500),
});

export async function POST(request: Request) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

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
  } catch {
    return NextResponse.json({ error: "Invalid IP address or reason" }, { status: 400 });
  }

  // 3. Insert into banlist
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("ip_banlist").insert({
      ip_address: ip,
      reason,
      banned_by: adminUser.id,
      banned_at: new Date().toISOString(),
      expires_at: null, // Permanent ban
    });

    if (error) {
      // Duplicate key error (IP already banned)
      if (error.code === "23505") {
        logger.admin.warn("IP already banned", { ip, adminId: adminUser.id });
        return NextResponse.json(
          { error: "Bu IP adresi zaten yasaklı", alreadyBanned: true },
          { status: 409 }
        );
      }
      throw error;
    }

    logger.admin.info("IP banned", { ip, reason, adminId: adminUser.id });
    captureServerEvent("ip_banned", { ip, reason }, adminUser.id);

    // Redirect back to security page
    return NextResponse.redirect(new URL("/admin/security", request.url));
  } catch (error) {
    logger.admin.error("Failed to ban IP", error, { ip, adminId: adminUser.id });
    return NextResponse.json({ error: "Failed to ban IP" }, { status: 500 });
  }
}
