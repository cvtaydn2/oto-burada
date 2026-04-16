import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const ALLOWED_NEXT_PATHS = /^\/[a-zA-Z0-9\-_/?=&%#.]+$/;

function sanitizeNextParam(next: string | null): string {
  if (!next) return "/dashboard";
  // Only allow relative paths starting with /
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  // Block protocol-relative and absolute URLs
  if (/^\/[a-z]+:/i.test(next)) return "/dashboard";
  // Only allow safe characters
  if (!ALLOWED_NEXT_PATHS.test(next)) return "/dashboard";
  // Block admin redirect from callback (must be explicit login)
  if (next.startsWith("/admin")) return "/dashboard";
  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const next = sanitizeNextParam(rawNext);

  if (!code || !hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
