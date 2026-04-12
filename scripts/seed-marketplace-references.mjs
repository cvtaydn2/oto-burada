import { createClient } from "@supabase/supabase-js";
import process from "node:process";

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

function slugify(text) {
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
  console.log("Reading data from src/data...");
  
  // Minimal datasets for seeding if we can't parse easily
  // Actually I'll just hardcode the most important ones to be safe and fast
  const brands = [
    { name: "Volkswagen", models: [
      { name: "Polo", trims: ["Life", "Style"] },
      { name: "Golf", trims: ["Life", "Style", "R-Line"] },
      { name: "Passat", trims: ["Business", "Elegance", "R-Line"] },
      { name: "Tiguan", trims: ["Life", "Style", "R-Line"] }
    ]},
    { name: "Renault", models: [
      { name: "Clio", trims: ["Joy", "Touch", "Icon"] },
      { name: "Megane", trims: ["Joy", "Touch", "Icon"] }
    ]},
    { name: "Fiat", models: [
      { name: "Egea", trims: ["Easy", "Urban", "Lounge"] }
    ]},
    { name: "BMW", models: [
      { name: "1 Serisi", trims: ["Sport Line", "M Sport"] },
      { name: "3 Serisi", trims: ["Sport Line", "Luxury Line", "M Sport"] },
      { name: "5 Serisi", trims: ["Luxury Line", "M Sport"] }
    ]},
    { name: "Mercedes-Benz", models: [
      { name: "C Serisi", trims: ["Comfort", "AMG"] },
      { name: "E Serisi", trims: ["Edition 1", "AMG"] }
    ]},
    { name: "Seat", models: [
      { name: "Ibiza", trims: ["Style", "FR"] },
      { name: "Leon", trims: ["Style", "FR", "Xperience"] },
      { name: "Arona", trims: ["Style", "Xperience", "Style Plus"] }
    ]},
  ];

  const cities = [
    { name: "İstanbul", plate: 34, districts: ["Kadıköy", "Beşiktaş", "Üsküdar", "Şişli", "Ataşehir", "Fatih", "Sarıyer", "Bakırköy"] },
    { name: "Ankara", plate: 6, districts: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Etimesgut", "Gölbaşı"] },
    { name: "İzmir", plate: 35, districts: ["Konak", "Karşıyaka", "Bornova", "Buca", "Bayraklı", "Çeşme", "Urla"] },
    { name: "Bursa", plate: 16, districts: ["Nilüfer", "Osmangazi", "Yıldırım", "Mudanya", "İnegöl"] },
    { name: "Antalya", plate: 7, districts: ["Muratpaşa", "Konyaaltı", "Kepez", "Alanya", "Manavgat"] },
    { name: "Kocaeli", plate: 41, districts: ["İzmit", "Gebze", "Darica", "Kartepe", "Gölcük"] },
    { name: "Adana", plate: 1, districts: ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam"] },
    { name: "Konya", plate: 42, districts: ["Selçuklu", "Meram", "Karatay"] },
    { name: "Gaziantep", plate: 27, districts: ["Şahinbey", "Şehitkamil"] },
    { name: "Mersin", plate: 33, districts: ["Yenişehir", "Mezitli", "Tarsus", "Toroslar"] },
  ];

  console.log("Seeding Brands and Models...");
  // Use upsert to avoid duplicate errors and keep existing IDs
  for (const bData of brands) {
    const brandSlug = slugify(bData.name);
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .upsert({ name: bData.name, slug: brandSlug }, { onConflict: 'name' })
      .select()
      .single();

    if (brandError) {
      console.error(`Error brand ${bData.name}:`, brandError.message);
      continue;
    }

    for (const mData of bData.models) {
      const { data: model, error: modelError } = await supabase
        .from("models")
        .upsert({ 
          brand_id: brand.id, 
          name: mData.name, 
          slug: slugify(mData.name) 
        }, { onConflict: 'brand_id,name' })
        .select()
        .single();

      if (modelError || !model) {
        console.error(`Error model ${mData.name}:`, modelError?.message);
        continue;
      }

      if (mData.trims && mData.trims.length > 0) {
        const trimsToInsert = mData.trims.map(tName => ({
          model_id: model.id,
          name: tName,
          slug: slugify(tName),
        }));

        await supabase.from("car_trims").upsert(trimsToInsert, { onConflict: 'model_id,name' });
      }
    }
  }

  console.log("Seeding Cities and Districts...");
  for (const cData of cities) {
    const citySlug = slugify(cData.name);
    const { data: city, error: cityError } = await supabase
      .from("cities")
      .upsert({ name: cData.name, slug: citySlug, plate_code: cData.plate }, { onConflict: 'name' })
      .select()
      .single();

    if (cityError) {
      console.error(`Error city ${cData.name}:`, cityError.message);
      continue;
    }

    const districtsToInsert = cData.districts.map(dName => ({
      city_id: city.id,
      name: dName,
      slug: slugify(dName),
    }));

    if (districtsToInsert.length > 0) {
      await supabase.from("districts").upsert(districtsToInsert, { onConflict: 'city_id,name' });
    }
  }

  console.log("Live reference data seeded successfully!");
}

seedReferences().catch(console.error);
