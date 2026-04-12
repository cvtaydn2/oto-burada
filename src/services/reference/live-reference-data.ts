import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BrandCatalogItem, CityOption, SearchSuggestionItem } from "@/types";

function sortLocale(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right, "tr"));
}

type DBBrand = { id: string; name: string };
type DBModel = { id: string; brand_id: string; name: string };
type DBTrim = { model_id: string; name: string };
type DBCity = { id: string; name: string; plate_code: number };
type DBDistrict = { city_id: string; name: string };

const POPULAR_BRANDS: BrandCatalogItem[] = [
  { brand: "Volkswagen", slug: "volkswagen", name: "Volkswagen", models: [
    { name: "Passat", trims: ["Business", "Elegance", "R-Line"] },
    { name: "Golf", trims: ["Life", "Style", "R-Line"] },
    { name: "Polo", trims: ["Life", "Style"] }
  ]},
  { brand: "Renault", slug: "renault", name: "Renault", models: [
    { name: "Clio", trims: ["Joy", "Touch", "Icon"] },
    { name: "Megane", trims: ["Joy", "Touch", "Icon"] }
  ]},
  { brand: "Fiat", slug: "fiat", name: "Fiat", models: [
    { name: "Egea", trims: ["Easy", "Urban", "Lounge"] }
  ]},
  { brand: "BMW", slug: "bmw", name: "BMW", models: [
    { name: "3 Serisi", trims: ["M Sport", "Sport Line", "Luxury Line"] }
  ]},
];

const POPULAR_CITIES: CityOption[] = [
  { city: "İstanbul", slug: "istanbul", cityPlate: 34, districts: ["Kadıköy", "Beşiktaş", "Şişli", "Üsküdar"] },
  { city: "Ankara", slug: "ankara", cityPlate: 6, districts: ["Çankaya", "Keçiören", "Yenimahalle"] },
  { city: "İzmir", slug: "izmir", cityPlate: 35, districts: ["Konak", "Karşıyaka", "Bornova"] },
];

export async function getLiveMarketplaceReferenceData() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: brandsData },
    { data: modelsData },
    { data: trimsData },
    { data: citiesData },
    { data: districtsData }
  ] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("models").select("id, brand_id, name").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("car_trims").select("model_id, name").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("cities").select("id, name, plate_code").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("districts").select("city_id, name").eq("is_active", true).order("name", { ascending: true })
  ]);

  const safeBrandsData = Array.isArray(brandsData) ? (brandsData as DBBrand[]) : [];
  const safeModelsData = Array.isArray(modelsData) ? (modelsData as DBModel[]) : [];
  const safeTrimsData = Array.isArray(trimsData) ? (trimsData as DBTrim[]) : [];
  const safeCitiesData = Array.isArray(citiesData) ? (citiesData as DBCity[]) : [];
  const safeDistrictsData = Array.isArray(districtsData) ? (districtsData as DBDistrict[]) : [];

  const brands: BrandCatalogItem[] = safeBrandsData.map((b: DBBrand) => ({
    brand: b.name,
    slug: b.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: b.name,
    models: safeModelsData
      .filter((m: DBModel) => m.brand_id === b.id)
      .map(m => ({
        name: m.name,
        trims: sortLocale(safeTrimsData.filter(t => t.model_id === m.id).map(t => t.name))
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "tr"))
  }));

  const cities: CityOption[] = safeCitiesData.map((c: DBCity) => ({
    city: c.name,
    slug: c.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    cityPlate: c.plate_code,
    districts: sortLocale(safeDistrictsData.filter((d: DBDistrict) => d.city_id === c.id).map((d: DBDistrict) => d.name))
  }));

  const uniqueSuggestions = new Map<string, SearchSuggestionItem>();
  
  // Include all active brands
  for (const b of safeBrandsData) {
    uniqueSuggestions.set(`brand:${b.name.toLowerCase()}`, { label: b.name, type: "brand", value: b.name });
    
    // Add first 5 models for EACH brand to increase coverage
    const brandModels = safeModelsData.filter((m: DBModel) => m.brand_id === b.id).slice(0, 5);
    for (const m of brandModels) {
      const val = `${b.name} ${m.name}`;
      uniqueSuggestions.set(`model:${val.toLowerCase()}`, { label: val, type: "model", value: val });
    }
  }

  // Include top cities
  for (const c of safeCitiesData) {
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
    brands: Array.isArray(brands) && brands.length > 0 ? brands : POPULAR_BRANDS, 
    cities: Array.isArray(cities) && cities.length > 0 ? cities : POPULAR_CITIES, 
    searchSuggestions: Array.isArray(searchSuggestions) ? searchSuggestions : []
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
      slug: city.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      cityPlate: null,
      districts: [],
    });
  }

  return sortLocale([...cityMap.keys()]).map((city) => cityMap.get(city)!);
}
