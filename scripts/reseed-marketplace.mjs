import process from "node:process";

import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.SUPABASE_DEMO_USER_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !demoPassword) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DEMO_USER_PASSWORD are required."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const CITIES = [
  { name: "Istanbul", districts: ["Kadikoy", "Besiktas", "Uskudar", "Sariyer", "Bakirkoy"] },
  { name: "Ankara", districts: ["Cankaya", "Yenimahalle", "Etimesgut", "Kecioren", "Gop"] },
  { name: "Izmir", districts: ["Karsiyaka", "Bornova", "Konak", "Cesme", "Alacati"] },
  { name: "Bursa", districts: ["Nilufer", "Osmangazi", "Yildirim"] },
  { name: "Antalya", districts: ["Muratpasa", "Konyaalti", "Lara"] },
];

const CAR_DATA = [
  { brand: "Volkswagen", models: ["Golf", "Passat", "Polo", "Tiguan"], trims: ["Highline", "Comfortline", "R-Line"] },
  { brand: "BMW", models: ["320i", "520d", "X5", "118i"], trims: ["M Sport", "Luxury Line", "Executive"] },
  { brand: "Mercedes-Benz", models: ["C200", "E250", "A180", "CLA200"], trims: ["AMG", "Exclusive", "Style"] },
  { brand: "Renault", models: ["Clio", "Megane", "Captur"], trims: ["Icon", "Touch", "Joy"] },
  { brand: "Toyota", models: ["Corolla", "Yaris", "C-HR"], trims: ["Flame", "Dream", "Passion"] },
  { brand: "Honda", models: ["Civic", "CR-V", "Jazz"], trims: ["Executive", "Elegance", "Premium"] },
  { brand: "Ford", models: ["Focus", "Fiesta", "Kuga"], trims: ["Titanium", "ST-Line", "Trend"] },
];

const IMAGES = [
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506469717960-433cebe3f181?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
];

async function cleanup() {
  console.log("Cleaning up existing data...");

  // Tables to clear in order (to avoid FK issues)
  const tablesToClear = [
    "listing_images",
    "favorites",
    "reports",
    "listing_views",
    "chats",
    "messages",
    "offers",
    "phone_reveal_logs",
    "listing_price_history",
    "payments",
    "doping_applications",
    "doping_purchases",
    "notifications",
    "tickets",
    "admin_actions",
    "fulfillment_jobs",
    "storage_objects_registry",
    "user_quotas",
    "user_read_writes_tracker",
    "user_encryption_keys",
    "notification_preferences",
    "credit_transactions",
    "saved_searches",
    "gallery_views",
    "seller_reviews",
    "realized_sales",
    "compensating_actions",
    "transaction_outbox",
    "ip_banlist",
    "contact_abuse_log"
  ];

  for (const table of tablesToClear) {
    try {
      // Try to delete all rows
      const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        // Fallback for tables without 'id' or different constraints
        await supabase.from(table).delete().not("created_at", "is", null);
      }
    } catch (e) {
      console.warn(`Could not clear table ${table}:`, e.message);
    }
  }

  // Delete listings
  const { error: listingsError } = await supabase.from("listings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (listingsError) console.warn("Listings deletion warning:", listingsError.message);

  // 2. Identify non-admin users
  const { data: profiles, error: profilesFetchError } = await supabase
    .from("profiles")
    .select("id")
    .neq("role", "admin");

  if (profilesFetchError) throw profilesFetchError;

  const userIds = profiles.map(p => p.id);
  console.log(`Found ${userIds.length} non-admin users to remove.`);

  for (const id of userIds) {
    try {
      // Delete profile first to break FKs if necessary, though auth delete usually handles it
      await supabase.from("profiles").delete().eq("id", id);
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
      if (deleteAuthError) console.warn(`Could not delete auth user ${id}:`, deleteAuthError.message);
    } catch (e) {
      console.warn(`Error deleting user ${id}:`, e.message);
    }
  }

  console.log("Cleanup complete.");
}

async function createDemoUsers() {
  const users = [
    { email: "user1@otoburada.demo", fullName: "Ahmet Yilmaz", city: "Istanbul", phone: "+905321110001" },
    { email: "user2@otoburada.demo", fullName: "Mehmet Demir", city: "Ankara", phone: "+905321110002" },
    { email: "user3@otoburada.demo", fullName: "Canan Kaya", city: "Izmir", phone: "+905321110003" },
    { email: "user4@otoburada.demo", fullName: "Elif Sahin", city: "Bursa", phone: "+905321110004" },
    { email: "user5@otoburada.demo", fullName: "Mustafa Celik", city: "Antalya", phone: "+905321110005" },
  ];

  const createdUsers = [];

  // Get all existing users to check by email
  const { data: { users: existingUsers }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  for (const u of users) {
    let user;
    const existing = existingUsers.find(eu => eu.email === u.email);

    if (existing) {
      console.log(`User ${u.email} already exists, updating...`);
      const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: demoPassword,
        user_metadata: {
          full_name: u.fullName,
          role: "user",
        },
      });
      if (error) throw error;
      user = data.user;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: "user",
        },
      });
      if (error) throw error;
      user = data.user;
      console.log(`Created user: ${u.email}`);
    }

    // UPSERT profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: u.fullName,
      city: u.city,
      phone: u.phone,
      role: "user",
    });

    if (profileError) throw profileError;

    createdUsers.push({ ...u, id: user.id });
  }

  return createdUsers;
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createListings(users) {
  console.log("Creating 50 listings (10 per user)...");

  const allListings = [];
  const allImages = [];

  for (const user of users) {
    for (let i = 0; i < 10; i++) {
      const car = getRandom(CAR_DATA);
      const model = getRandom(car.models);
      const trim = getRandom(car.trims);
      const city = getRandom(CITIES);
      const district = getRandom(city.districts);
      const year = 2015 + Math.floor(Math.random() * 9);
      const price = 500000 + Math.floor(Math.random() * 2000000);
      const mileage = Math.floor(Math.random() * 150000);
      const id = crypto.randomUUID();
      const slug = `${year}-${car.brand.toLowerCase()}-${model.toLowerCase()}-${trim.toLowerCase()}-${id.slice(0, 8)}`;

      allListings.push({
        id,
        seller_id: user.id,
        title: `${year} ${car.brand} ${model} ${trim}`,
        brand: car.brand,
        model,
        car_trim: trim,
        year,
        mileage,
        price,
        city: city.name,
        district,
        fuel_type: getRandom(["benzin", "dizel", "hibrit"]),
        transmission: getRandom(["manuel", "otomatik"]),
        status: "approved",
        description: `Sahibinden tertemiz ${car.brand} ${model}. Bakımları zamanında yapılmıştır. Kazasız, boyasız.`,
        whatsapp_phone: user.phone,
        slug,
        featured: Math.random() > 0.8,
        published_at: new Date().toISOString(),
      });

      // Add 2-3 images per listing
      const numImages = 2 + Math.floor(Math.random() * 2);
      const shuffledImages = [...IMAGES].sort(() => 0.5 - Math.random());

      for (let j = 0; j < numImages; j++) {
        allImages.push({
          listing_id: id,
          public_url: shuffledImages[j],
          storage_path: `seed/listings/${id}-${j}.jpg`,
          is_cover: j === 0,
          sort_order: j,
        });
      }
    }
  }

  const { error: listingsError } = await supabase.from("listings").insert(allListings);
  if (listingsError) throw listingsError;

  const { error: imagesError } = await supabase.from("listing_images").insert(allImages);
  if (imagesError) throw imagesError;

  console.log("Successfully created 50 listings and images.");
}

async function main() {
  try {
    await cleanup();
    const users = await createDemoUsers();
    await createListings(users);
    console.log("\n🚀 DATABASE RE-SEED COMPLETE!");
    console.log("Summary:");
    console.log("- Removed all non-admin users and their listings");
    console.log("- Created 5 new demo users");
    console.log("- Created 50 high-quality car listings (10 per user)");
    console.log("- All listings are approved and ready for display");
  } catch (error) {
    console.error("Critical error during re-seed:", error);
    process.exit(1);
  }
}

main();
