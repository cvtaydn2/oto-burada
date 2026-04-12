import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BrandCatalogItem, CityOption, SearchSuggestionItem } from "@/types";

function sortLocale(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right, "tr"));
}

type DBBrand = { id: string; name: string };
type DBModel = { brand_id: string; name: string };
type DBCity = { id: string; name: string; plate_code: number };
type DBDistrict = { city_id: string; name: string };

const POPULAR_BRANDS: BrandCatalogItem[] = [
  { brand: "Volkswagen", models: ["Passat", "Golf", "Polo", "Tiguan", "T-Roc"] },
  { brand: "Renault", models: ["Clio", "Megane", "Symbol", "Kadjar", "Fluence"] },
  { brand: "Fiat", models: ["Egea", "Linea", "Doblo", "Fiorino", "500"] },
  { brand: "Toyota", models: ["Corolla", "Auris", "Yaris", "Rav4", "CH-R"] },
  { brand: "BMW", models: ["3 Serisi", "5 Serisi", "1 Serisi", "X5", "X3"] },
];

const POPULAR_CITIES: CityOption[] = [
  { city: "İstanbul", cityPlate: 34, districts: ["Kadıköy", "Beşiktaş", "Şişli", "Üsküdar"] },
  { city: "Ankara", cityPlate: 6, districts: ["Çankaya", "Keçiören", "Yenimahalle"] },
  { city: "İzmir", cityPlate: 35, districts: ["Konak", "Karşıyaka", "Bornova"] },
];

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
  
  // Include all active brands
  for (const b of (brandsData || [])) {
    uniqueSuggestions.set(`brand:${b.name.toLowerCase()}`, { label: b.name, type: "brand", value: b.name });
    
    // Add first 10 models for EACH brand to increase coverage
    const brandModels = (modelsData || []).filter((m: DBModel) => m.brand_id === b.id).slice(0, 5);
    for (const m of brandModels) {
      const val = `${b.name} ${m.name}`;
      uniqueSuggestions.set(`model:${val.toLowerCase()}`, { label: val, type: "model", value: val });
    }
  }

  // Include top cities
  for (const c of (citiesData || [])) {
    uniqueSuggestions.set(`city:${c.name.toLowerCase()}`, { label: c.name, type: "city", value: c.name });
  }

  // Frontend will handle the filtering by query, but we return a large enough pool
  const searchSuggestions = [...uniqueSuggestions.values()]
    .sort((left, right) => {
      // Prioritize brands/models over cities in the default list
      if (left.type !== right.type) {
        if (left.type === "brand") return -1;
        if (right.type === "brand") return 1;
        if (left.type === "model") return -1;
        if (right.type === "model") return 1;
      }
      return left.label.localeCompare(right.label, "tr");
    })
    .slice(0, 100); // Return top 100 to let frontend filter effectively

  return { 
    brands: brands.length > 0 ? brands : POPULAR_BRANDS, 
    cities: cities.length > 0 ? cities : POPULAR_CITIES, 
    searchSuggestions 
  };
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
