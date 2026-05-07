import { getCachedData, setCachedData } from "@/features/shared/lib/client";
import { enforceRateLimit, getRateLimitKey } from "@/features/shared/lib/rate-limit-middleware";
import { apiSuccess } from "@/features/shared/lib/response";
import { createSupabaseServerClient } from "@/features/shared/lib/server";

export const dynamic = "force-dynamic";

// Rate limit: 60 per minute per IP
const SUGGESTIONS_RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };

// Sanitize search query — only allow alphanumeric + Turkish chars + spaces
function sanitizeSearchQuery(q: string): string {
  return q
    .replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u0130\u0131]/g, "")
    .trim()
    .substring(0, 50); // max 50 chars
}

export async function GET(request: Request) {
  const rateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:search:suggestions"),
    SUGGESTIONS_RATE_LIMIT
  );
  if (rateLimit.response) return rateLimit.response;

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get("q") ?? "";
  const q = sanitizeSearchQuery(rawQ);

  if (q.length < 2) {
    return apiSuccess({ brands: [], models: [] });
  }

  // Cache suggestions for 2 minutes
  const cacheKey = `search:suggestions:${q.toLowerCase()}`;
  const cached = await getCachedData<{ brands: unknown[]; models: unknown[] }>(cacheKey);
  if (cached) return apiSuccess(cached);

  try {
    const supabase = await createSupabaseServerClient();

    const [brandsResult, modelsResult] = await Promise.all([
      supabase
        .from("brands")
        .select("name, slug")
        .ilike("name", `${q}%`)
        .eq("is_active", true)
        .limit(5),
      supabase
        .from("models")
        .select("name, slug, brands(name)")
        .ilike("name", `${q}%`)
        .eq("is_active", true)
        .limit(5),
    ]);

    const result = {
      brands: brandsResult.data ?? [],
      models: (modelsResult.data ?? []).map(
        (m: { name: string; slug: string; brands?: { name: string }[] | null }) => ({
          name: m.name,
          slug: m.slug,
          brandName: m.brands?.[0]?.name,
        })
      ),
    };

    await setCachedData(cacheKey, result, 120);

    return apiSuccess(result);
  } catch (error) {
    // Non-critical — but capture for observability
    const { captureServerError } = await import("@/features/shared/lib/telemetry-server");
    captureServerError("Search suggestions query failed", "search", error, { query: q });
    return apiSuccess({ brands: [], models: [] });
  }
}
