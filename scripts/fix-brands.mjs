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

const brandImages = {
  Citroën:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80",
  Mitsubishi:
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=200&q=80",
  Suzuki:
    "https://images.unsplash.com/photo-1609621263047-f8f205293f24?auto=format&fit=crop&w=200&q=80",
  SsangYong:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=200&q=80",
  Subaru:
    "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=200&q=80",
  Jaguar:
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=200&q=80",
  "Land Rover":
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=200&q=80",
  Porsche:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80",
  MINI: "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&w=200&q=80",
  "Alfa Romeo":
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=200&q=80",
  Mazda:
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=200&q=80",
  Lexus:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80",
  Infiniti:
    "https://images.unsplash.com/photo-1506469717960-433cebe3f181?auto=format&fit=crop&w=200&q=80",
  Chevrolet:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80",
  Dodge:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80",
  Jeep: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=200&q=80",
  Isuzu:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=200&q=80",
  Haval:
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=200&q=80",
  Changan:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80",
  MG: "https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&w=200&q=80",
  Cupra:
    "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=200&q=80",
  Peugeot:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80",
  Skoda:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=200&q=80",
  Hyundai:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80",
  Kia: "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&w=200&q=80",
  Dacia:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80",
  Volvo:
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=200&q=80",
  Togg: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80",
  Tesla:
    "https://images.unsplash.com/photo-1560958089-e8f3a43c1d0b?auto=format&fit=crop&w=200&q=80",
  Nissan:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=200&q=80",
  Nisan:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=200&q=80", // duplicate fix
};

async function main() {
  console.log("Updating all brands with images...\n");

  let updated = 0;
  for (const [name, imageUrl] of Object.entries(brandImages)) {
    const { error } = await supabase
      .from("brands")
      .update({ image_url: imageUrl })
      .eq("name", name);

    if (error) {
      console.log(`  ${name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${name}`);
      updated++;
    }
  }

  console.log(`\n✓ ${updated} brands updated!`);
}

main();
