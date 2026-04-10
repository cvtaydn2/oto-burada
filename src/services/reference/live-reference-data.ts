import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BrandCatalogItem, CityOption, SearchSuggestionItem } from "@/types";

function sortLocale(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right, "tr"));
}

type DBBrand = { id: string; name: string };
type DBModel = { brand_id: string; name: string };
type DBCity = { id: string; name: string; plate_code: number };
type DBDistrict = { city_id: string; name: string };

export async function getLiveMarketplaceReferenceData() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: brandsData },
    { data: modelsData },
    { data: citiesData },
    { data: districtsData }
  ] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("models").select("brand_id, name").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("cities").select("id, name, plate_code").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("districts").select("city_id, name").eq("is_active", true).order("name", { ascending: true })
  ]);

  const brands: BrandCatalogItem[] = (brandsData || []).map((b: DBBrand) => ({
    brand: b.name,
    models: sortLocale((modelsData || []).filter((m: DBModel) => m.brand_id === b.id).map((m: DBModel) => m.name))
  }));

  const cities: CityOption[] = (citiesData || []).map((c: DBCity) => ({
    city: c.name,
    cityPlate: c.plate_code,
    districts: sortLocale((districtsData || []).filter((d: DBDistrict) => d.city_id === c.id).map((d: DBDistrict) => d.name))
  }));

  const uniqueSuggestions = new Map<string, SearchSuggestionItem>();
  
  for (const b of (brandsData || []).slice(0, 10)) {
    uniqueSuggestions.set(`brand:${b.name}`, { label: b.name, type: "brand", value: b.name });
    const topModels = (modelsData || []).filter((m: DBModel) => m.brand_id === b.id).slice(0, 3);
    for (const m of topModels) {
      const val = `${b.name} ${m.name}`;
      uniqueSuggestions.set(`model:${val}`, { label: val, type: "model", value: val });
    }
  }

  for (const c of (citiesData || []).slice(0, 10)) {
    uniqueSuggestions.set(`city:${c.name}`, { label: c.name, type: "city", value: c.name });
  }

  const searchSuggestions = [...uniqueSuggestions.values()]
    .sort((left, right) => left.label.localeCompare(right.label, "tr"))
    .slice(0, 15);

  return { brands, cities, searchSuggestions };
}

export function mergeCityOptions(cities: CityOption[], extraCities: string[]) {
  const cityMap = new Map(cities.map((city) => [city.city, city]));

  for (const city of extraCities) {
    if (!city.trim() || cityMap.has(city)) {
      continue;
    }

    cityMap.set(city, {
      city,
      cityPlate: null,
      districts: [],
    });
  }

  return sortLocale([...cityMap.keys()]).map((city) => cityMap.get(city)!);
}
