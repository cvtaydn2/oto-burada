import { createClient } from "@supabase/supabase-js";
import { brandCatalog } from "../src/data/car-catalog";
import { cityOptions } from "../src/data/locations";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env.local file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function seedReferences() {
  console.log("Seeding Brands and Models...");
  // Clear existing
  await supabase.from("models").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("brands").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const [bIndex, brandData] of brandCatalog.entries()) {
    const brandSlug = slugify(brandData.brand);

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .insert({
        name: brandData.brand,
        slug: brandSlug,
        sort_order: bIndex,
      })
      .select()
      .single();

    if (brandError) {
      console.error(`Failed to insert brand ${brandData.brand}:`, brandError.message);
      continue;
    }

    const modelsToInsert = brandData.models.map((mName, mIndex) => ({
      brand_id: brand.id,
      name: mName,
      slug: slugify(mName),
      sort_order: mIndex,
    }));

    if (modelsToInsert.length > 0) {
      const { error: modelsError } = await supabase.from("models").insert(modelsToInsert);
      if (modelsError) {
        console.error(`Failed to insert models for ${brandData.brand}:`, modelsError.message);
      }
    }
  }

  console.log("Seeding Cities and Districts...");
  await supabase.from("districts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("cities").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const cityData of cityOptions) {
    const citySlug = slugify(cityData.city);
    // fallback platecode
    const plate = cityData.cityPlate || Math.floor(Math.random() * 1000) + 100;

    const { data: city, error: cityError } = await supabase
      .from("cities")
      .insert({
        name: cityData.city,
        slug: citySlug,
        plate_code: plate,
      })
      .select()
      .single();

    if (cityError) {
      console.error(`Failed to insert city ${cityData.city}:`, cityError.message);
      continue;
    }

    // Districts
    const districtsToInsert = cityData.districts.map((dName) => ({
      city_id: city.id,
      name: dName,
      slug: slugify(dName),
    }));

    if (districtsToInsert.length > 0) {
      const { error: districtError } = await supabase.from("districts").insert(districtsToInsert);
      if (districtError) {
        console.error(`Failed to insert districts for ${cityData.city}:`, districtError.message);
      }
    }
  }

  console.log("Reference data seeded enthusiastically!");
}

seedReferences().catch(console.error);
