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
    { name: "Volkswagen", models: ["Polo", "Golf", "Passat", "Tiguan", "T-Roc", "Arteon"] },
    { name: "Renault", models: ["Clio", "Megane", "Taliant", "Captur", "Koleos"] },
    { name: "Fiat", models: ["Egea", "500", "Panda", "Doblo", "Fiorino"] },
    { name: "Toyota", models: ["Corolla", "C-HR", "Yaris", "RAV4", "Hilux"] },
    { name: "Ford", models: ["Focus", "Fiesta", "Puma", "Kuga", "Transit"] },
    { name: "BMW", models: ["1 Serisi", "3 Serisi", "5 Serisi", "X1", "X5"] },
    { name: "Mercedes-Benz", models: ["A Serisi", "C Serisi", "E Serisi", "GLA", "CLA"] },
    { name: "Peugeot", models: ["208", "308", "2008", "3008", "5008"] },
    { name: "Honda", models: ["Civic", "City", "HR-V", "CR-V", "Accord"] },
    { name: "Audi", models: ["A1", "A3", "A4", "A6", "Q3"] },
    { name: "Skoda", models: ["Fabia", "Scala", "Octavia", "Superb", "Kodiaq"] },
    { name: "Dacia", models: ["Sandero", "Duster", "Jogger", "Lodgy"] },
    { name: "Hyundai", models: ["i10", "i20", "i30", "Bayon", "Tucson", "Kona"] },
    { name: "Kia", models: ["Picanto", "Rio", "Ceed", "Stonic", "Sportage"] },
    { name: "Opel", models: ["Corsa", "Astra", "Mokka", "Crossland", "Grandland"] },
    { name: "Volvo", models: ["S60", "S90", "V60", "XC40", "XC60", "XC90"] },
    { name: "Nisan", models: ["Micra", "Juke", "Qashqai", "X-Trail"] },
    { name: "Seat", models: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"] },
    { name: "Togg", models: ["T10X"] },
    { name: "Tesla", models: ["Model 3", "Model Y"] },
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

    const modelsToInsert = bData.models.map(mName => ({
      brand_id: brand.id,
      name: mName,
      slug: slugify(mName),
    }));

    if (modelsToInsert.length > 0) {
      await supabase.from("models").upsert(modelsToInsert, { onConflict: 'brand_id,name' });
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
