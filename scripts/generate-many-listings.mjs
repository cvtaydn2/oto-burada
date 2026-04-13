import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const brands = [
  { name: "Volkswagen", models: ["Golf", "Passat", "Polo", "Tiguan"] },
  { name: "Renault", models: ["Clio", "Megane", "Captur", "Kadjar"] },
  { name: "BMW", models: ["320i", "520d", "116d", "X5"] },
  { name: "Mercedes-Benz", models: ["C 180", "E 200", "A 180", "GLA 200"] },
  { name: "Audi", models: ["A3", "A4", "A6", "Q3"] },
  { name: "Seat", models: ["Leon", "Ibiza", "Ateca", "Arona"] },
  { name: "Toyota", models: ["Corolla", "Yaris", "C-HR", "Rav4"] },
  { name: "Honda", models: ["Civic", "City", "HR-V", "CR-V"] },
  { name: "Fiat", models: ["Egea", "Panda", "500", "Egea Cross"] },
  { name: "Opel", models: ["Astra", "Corsa", "Insignia", "Mokka"] },
  { name: "Ford", models: ["Focus", "Fiesta", "Puma", "Kuga"] },
];

const cities = [
  { city: "Istanbul", districts: ["Kadikoy", "Besiktas", "Uskudar", "Atasehir", "Sisli"] },
  { city: "Ankara", districts: ["Cankaya", "Etimesgut", "Yenimahalle", "Kecioren"] },
  { city: "Izmir", districts: ["Bornova", "Karsiyaka", "Konak", "Buca"] },
  { city: "Bursa", districts: ["Nilüfer", "Osmangazi", "Yildirim"] },
  { city: "Antalya", districts: ["Muratpasa", "Konyaalti", "Kepez"] },
];

const carImages = [
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d",
  "https://images.unsplash.com/photo-1494905998402-395d579af36f",
  "https://images.unsplash.com/photo-1506469717960-433cebe3f181",
  "https://images.unsplash.com/photo-1619405399517-d7fce0f13302",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8",
  "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd",
  "https://images.unsplash.com/photo-1520116468816-95b69f847357",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8",
  "https://images.unsplash.com/photo-1525609002752-ad9195461250",
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d",
  "https://images.unsplash.com/photo-1542281286-9e0a16bb7366",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
];

async function generateListings(count = 50) {
  const { data: users } = await supabase.from("profiles").select("id");
  if (!users || users.length === 0) {
    console.error("No users found to assign listings to.");
    return;
  }

  const listings = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < count; i++) {
    const brandObj = brands[Math.floor(Math.random() * brands.length)];
    const model = brandObj.models[Math.floor(Math.random() * brandObj.models.length)];
    const loc = cities[Math.floor(Math.random() * cities.length)];
    const district = loc.districts[Math.floor(Math.random() * loc.districts.length)];
    const year = currentYear - Math.floor(Math.random() * 10);
    const mileage = Math.floor(Math.random() * 150000);
    const price = 500000 + Math.floor(Math.random() * 2000000);
    const seller = users[Math.floor(Math.random() * users.length)];
    const id = crypto.randomUUID();

    listings.push({
      id,
      seller_id: seller.id,
      slug: `${id.slice(0, 8)}-${brandObj.name.toLowerCase()}-${model.toLowerCase().replace(/ /g, "-")}-${year}`,
      title: `${year} Model Temiz ${brandObj.name} ${model}`,
      brand: brandObj.name,
      model,
      year,
      mileage,
      fuel_type: ["benzin", "dizel", "lpg", "hibrit"][Math.floor(Math.random() * 4)],
      transmission: ["manuel", "otomatik"][Math.floor(Math.random() * 2)],
      price,
      city: loc.city,
      district,
      description: "Araç özenle kullanılmış olup bakımları zamanında yapılmıştır. Herhangi bir sorunu yoktur, alıcısına şimdiden hayırlı olsun.",
      whatsapp_phone: "+90532" + Math.floor(1000000 + Math.random() * 8999999),
      status: "approved",
      market_price_index: 0.9 + Math.random() * 0.2, // Between 0.9 and 1.1
      featured: Math.random() > 0.8,
      published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  console.log(`Upserting ${listings.length} listings...`);
  const { error } = await supabase.from("listings").upsert(listings);
  if (error) {
    console.error("Listing Upsert Error:", error);
    return;
  }

  // Generate 3 images for each listing
  const images = [];
  for (const listing of listings) {
    for (let j = 0; j < 3; j++) {
      const imgUrl = carImages[Math.floor(Math.random() * carImages.length)] + "?auto=format&fit=crop&w=1200&q=80";
      images.push({
        listing_id: listing.id,
        public_url: imgUrl,
        storage_path: `seed/generated/${listing.id}-${j}.jpg`,
        sort_order: j,
        is_cover: j === 0,
      });
    }
  }

  console.log(`Upserting ${images.length} images...`);
  const { error: imgError } = await supabase.from("listing_images").upsert(images);
  if (imgError) {
    console.error("Image Upsert Error:", imgError);
  } else {
    console.log("Mega seed completed successfully.");
  }
}

generateListings(50).catch(console.error);
