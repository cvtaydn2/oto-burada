import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

// Push Subscription Payload Validation standard
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  // Enforce authentication guarding anonymous access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = pushSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscription contract" }, { status: 400 });
    }

    const { endpoint, keys } = parsed.data;

    // Insert or update existing endpoint uniquely
    const { error: dbError } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("push_subscriptions" as any)
      .upsert(
        {
          user_id: user.id,
          endpoint,
          auth_token: keys.auth,
          p256dh: keys.p256dh,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );

    if (dbError) {
      logger.notifications.error("Database registration for push token failed", dbError);
      return NextResponse.json({ error: "Storage persistence failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    logger.notifications.error("Push subscribe endpoint runtime error", err);
    return NextResponse.json({ error: "System failure" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json({ error: "Missing specific endpoint" }, { status: 400 });
    }

    const { error: dbError } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("push_subscriptions" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
