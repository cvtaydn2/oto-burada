import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess } from "@/lib/utils/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return apiSuccess({ brands: [], models: [] });
  }

  const supabase = await createSupabaseServerClient();

  // Search brands
  const { data: brands } = await supabase
    .from("brands")
    .select("name, slug")
    .ilike("name", `%${q}%`)
    .eq("is_active", true)
    .limit(5);

  // Search models
  const { data: models } = await supabase
    .from("models")
    .select("name, slug, brands(name)")
    .ilike("name", `%${q}%`)
    .eq("is_active", true)
    .limit(5);

  return apiSuccess({ 
    brands: brands || [], 
    models: (models || []).map((m: any) => ({
      name: m.name,
      slug: m.slug,
      brandName: m.brands?.name
    }))
  });
}
