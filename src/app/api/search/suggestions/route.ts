import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  // Return popular brands, models, cities for autocomplete
  const supabase = await createSupabaseServerClient();

  if (query.length < 1) {
    // Return popular searches when no query
    const popular = [
      { label: "BMW 3 Serisi", value: "BMW 3 Serisi", type: "model" },
      { label: "Fiat Egea", value: "Fiat Egea", type: "model" },
      { label: "Renault Clio", value: "Renault Clio", type: "model" },
      { label: "Mercedes C Serisi", value: "Mercedes C Serisi", type: "model" },
      { label: "İstanbul", value: "İstanbul", type: "city" },
      { label: "Ankara", value: "Ankara", type: "city" },
    ];
    return Response.json({ suggestions: popular });
  }

  // Search in listings for matching brands, models, cities
  const [brands, models, cities] = await Promise.all([
    supabase
      .from("listings")
      .select("brand")
      .ilike("brand", `%${query}%`)
      .eq("status", "approved")
      .limit(5),
    supabase
      .from("listings")
      .select("model")
      .ilike("model", `%${query}%`)
      .eq("status", "approved")
      .limit(5),
    supabase
      .from("listings")
      .select("city")
      .ilike("city", `%${query}%`)
      .eq("status", "approved")
      .limit(5),
  ]);

  const suggestions = [
    ...(brands.data || []).map((item: { brand: string }) => ({
      label: item.brand,
      value: item.brand,
      type: "brand" as const,
    })),
    ...(models.data || []).map((item: { model: string }) => ({
      label: item.model,
      value: item.model,
      type: "model" as const,
    })),
    ...(cities.data || []).map((item: { city: string }) => ({
      label: item.city,
      value: item.city,
      type: "city" as const,
    })),
  ].slice(0, 8);

  return Response.json({ suggestions });
}
