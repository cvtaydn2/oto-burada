import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/server";

const ALLOWED_NEXT_PATHS = /^\/[a-zA-Z0-9\-_/?=&%#.]+$/;

function sanitizeNextParam(next: string | null, isAdmin: boolean = false): string {
  if (!next) return "/dashboard";
  // Only allow relative paths starting with /
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  // Block protocol-relative and absolute URLs
  if (/^\/[a-z]+:/i.test(next)) return "/dashboard";
  // Only allow safe characters
  if (!ALLOWED_NEXT_PATHS.test(next)) return "/dashboard";

  // Block admin redirect from callback for non-admins
  if (next.startsWith("/admin") && !isAdmin) return "/dashboard";

  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");

  if (!code || !hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  // Check if user is admin to allow admin redirects
  const isAdmin = session.user.app_metadata.role === "admin";
  const next = sanitizeNextParam(rawNext, isAdmin);

  return NextResponse.redirect(new URL(next, request.url));
}
