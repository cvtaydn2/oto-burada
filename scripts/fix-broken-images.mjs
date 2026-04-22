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

async function fixBrokenImages() {
  // Step 1: Add brand image URLs
  console.log("Adding brand image URLs...");
  const brands = [
    {
      name: "Volkswagen",
      image_url:
        "https://images.unsplash.com/photo-1617788131607-c4fa1a5f7172?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Renault",
      image_url:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "BMW",
      image_url:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Mercedes-Benz",
      image_url:
        "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Audi",
      image_url:
        "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Seat",
      image_url:
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Toyota",
      image_url:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Honda",
      image_url:
        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Fiat",
      image_url:
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Opel",
      image_url:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Ford",
      image_url:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80",
    },
  ];

  for (const brand of brands) {
    const { error } = await supabase
      .from("brands")
      .update({ image_url: brand.image_url })
      .eq("name", brand.name);

    if (error) {
      console.error(`Error updating brand ${brand.name}:`, error.message);
    } else {
      console.log(`Updated brand: ${brand.name}`);
    }
  }

  // Step 2: Fix broken listing images - replace 404 URLs
  console.log("\nFetching listings with broken images...");
  const { data: listings } = await supabase.from("listings").select("id, brand").limit(50);

  if (!listings || listings.length === 0) {
    console.log("No listings found");
    return;
  }

  const validImages = {
    benzin: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d",
      "https://images.unsplash.com/photo-1494905998402-395d579af36f",
      "https://images.unsplash.com/photo-1506469717960-433cebe3f181",
      "https://images.unsplash.com/photo-1619405399517-d7fce0f13302",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
    ],
    dizel: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8",
      "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd",
      "https://images.unsplash.com/photo-1520116468816-95b69f847357",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
    ],
    lpg: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d",
      "https://images.unsplash.com/photo-1542281286-9e0a16bb7366",
    ],
    hibrit: [
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
      "https://images.unsplash.com/photo-1619405399517-d7fce0f13302",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d",
    ],
  };

  // Get all listings with their fuel types
  const { data: listingsWithFuel } = await supabase
    .from("listings")
    .select("id, brand, fuel_type")
    .limit(50);

  if (!listingsWithFuel || listingsWithFuel.length === 0) {
    return;
  }

  // Delete old images
  console.log("\nDeleting old images...");
  await supabase.from("listing_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Generate new images per listing
  const newImages = [];
  for (const listing of listingsWithFuel) {
    const fuelImages = validImages[listing.fuel_type] || validImages.benzin;
    for (let j = 0; j < 3; j++) {
      const imgUrl = fuelImages[j % fuelImages.length] + "?auto=format&fit=crop&w=1200&q=80";
      newImages.push({
        listing_id: listing.id,
        public_url: imgUrl,
        storage_path: `seed/fixed/${listing.id}-${j}.jpg`,
        sort_order: j,
        is_cover: j === 0,
      });
    }
  }

  console.log(`Inserting ${newImages.length} new images...`);
  const { error: imgError } = await supabase.from("listing_images").upsert(newImages);

  if (imgError) {
    console.error("Image insert error:", imgError.message);
  } else {
    console.log("Images fixed successfully!");
  }

  console.log("\n✓ Brand images and listing images updated!");
}

fixBrokenImages().catch(console.error);
