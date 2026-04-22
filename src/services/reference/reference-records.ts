import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/supabase/env";
import type { BrandCatalogItem, CityOption, SearchSuggestionItem } from "@/types";

/**
 * Shared Reference Utility functions
 */
function sortLocale(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right, "tr"));
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

/**
 * PUBLIC / MARKETPLACE METHODS
 */

type DBBrand = { id: string; name: string };
type DBModel = { id: string; brand_id: string; name: string };
type DBTrim = { model_id: string; name: string };
type DBCity = { id: string; name: string; plate_code: number };
type DBDistrict = { city_id: string; name: string };

async function fetchLiveMarketplaceReferenceData() {
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [
    { data: brandsData },
    { data: modelsData },
    { data: trimsData },
    { data: citiesData },
    { data: districtsData },
  ] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("models")
      .select("id, brand_id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("car_trims")
      .select("model_id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("cities")
      .select("id, name, plate_code")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("districts")
      .select("city_id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const safeBrandsData = Array.isArray(brandsData) ? (brandsData as DBBrand[]) : [];
  const safeModelsData = Array.isArray(modelsData) ? (modelsData as DBModel[]) : [];
  const safeTrimsData = Array.isArray(trimsData) ? (trimsData as DBTrim[]) : [];
  const safeCitiesData = Array.isArray(citiesData) ? (citiesData as DBCity[]) : [];
  const safeDistrictsData = Array.isArray(districtsData) ? (districtsData as DBDistrict[]) : [];

  const brands: BrandCatalogItem[] = safeBrandsData.map((b: DBBrand) => ({
    brand: b.name,
    slug: toSlug(b.name),
    name: b.name,
    models: safeModelsData
      .filter((m: DBModel) => m.brand_id === b.id)
      .map((m) => ({
        name: m.name,
        trims: sortLocale(safeTrimsData.filter((t) => t.model_id === m.id).map((t) => t.name)),
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "tr")),
  }));

  const cities: CityOption[] = safeCitiesData.map((c: DBCity) => ({
    city: c.name,
    slug: toSlug(c.name),
    cityPlate: c.plate_code,
    districts: sortLocale(
      safeDistrictsData.filter((d: DBDistrict) => d.city_id === c.id).map((d: DBDistrict) => d.name)
    ),
  }));

  const uniqueSuggestions = new Map<string, SearchSuggestionItem>();

  for (const b of safeBrandsData) {
    uniqueSuggestions.set(`brand:${b.name.toLowerCase()}`, {
      label: b.name,
      type: "brand",
      value: b.name,
    });
    const brandModels = safeModelsData.filter((m: DBModel) => m.brand_id === b.id).slice(0, 5);
    for (const m of brandModels) {
      const val = `${b.name} ${m.name}`;
      uniqueSuggestions.set(`model:${val.toLowerCase()}`, {
        label: val,
        type: "model",
        value: val,
      });
    }
  }

  for (const c of safeCitiesData) {
    uniqueSuggestions.set(`city:${c.name.toLowerCase()}`, {
      label: c.name,
      type: "city",
      value: c.name,
    });
  }

  const searchSuggestions = [...uniqueSuggestions.values()]
    .sort((left, right) => {
      if (left.type !== right.type) {
        if (left.type === "brand") return -1;
        if (right.type === "brand") return 1;
        if (left.type === "model") return -1;
        if (right.type === "model") return 1;
      }
      return left.label.localeCompare(right.label, "tr");
    })
    .slice(0, 100);

  return {
    brands,
    cities,
    searchSuggestions,
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
      slug: toSlug(city),
      cityPlate: null,
      districts: [],
    });
  }

  return sortLocale([...cityMap.keys()]).map((city) => cityMap.get(city)!);
}

export async function getLiveMarketplaceReferenceData() {
  if (
    process.env.NODE_ENV === "test" ||
    typeof window !== "undefined" ||
    !process.env.NEXT_RUNTIME
  ) {
    return fetchLiveMarketplaceReferenceData();
  }

  try {
    const { unstable_cache } = await import("next/cache");
    const getCached = unstable_cache(
      async () => fetchLiveMarketplaceReferenceData(),
      ["live-marketplace-reference-data"],
      { revalidate: 3600 }
    );
    return getCached();
  } catch {
    return fetchLiveMarketplaceReferenceData();
  }
}

/**
 * ADMIN / EDIT METHODS
 */

export async function getAdminBrands(query?: string) {
  if (!hasSupabaseAdminEnv()) return [];
  const admin = createSupabaseAdminClient();
  let rpc = admin.from("brands").select("*");

  if (query) {
    rpc = rpc.ilike("name", `%${query}%`);
  }

  const { data, error } = await rpc.order("name", { ascending: true });
  if (error) return [];
  return data;
}

export async function getAdminModelsByBrand(brandId: string) {
  if (!hasSupabaseAdminEnv()) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("models")
    .select("*")
    .eq("brand_id", brandId)
    .order("name", { ascending: true });

  if (error) return [];
  return data;
}

export async function updateBrandStatus(id: string, active: boolean) {
  if (!hasSupabaseAdminEnv()) return { success: false };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("brands").update({ is_active: active }).eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/reference");
  return { success: true };
}

export async function upsertBrand(name: string, id?: string) {
  if (!hasSupabaseAdminEnv()) return { success: false };
  const admin = createSupabaseAdminClient();
  const slug = toSlug(name);

  if (id) {
    const { error } = await admin.from("brands").update({ name, slug }).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("brands").insert({ name, slug, is_active: true });
    if (error) throw error;
  }

  revalidatePath("/admin/reference");
  return { success: true };
}

export async function addModel(brandId: string, name: string) {
  if (!hasSupabaseAdminEnv()) return { success: false };
  const admin = createSupabaseAdminClient();
  const slug = toSlug(name);

  const { error } = await admin.from("models").insert({ brand_id: brandId, name, slug });

  if (error) throw error;
  revalidatePath("/admin/reference");
  return { success: true };
}

export async function removeModel(id: string) {
  if (!hasSupabaseAdminEnv()) return { success: false };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("models").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/reference");
  return { success: true };
}

export async function removeBrand(id: string) {
  if (!hasSupabaseAdminEnv()) return { success: false };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("brands").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/reference");
  return { success: true };
}
