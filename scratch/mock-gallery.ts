import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

async function mockGallery() {
  const supabase = createSupabaseAdminClient();

  // Find a user to make a gallery
  const { data: users } = await supabase.from("profiles").select("id, fullName").limit(1);
  if (!users?.length) return console.log("No users found");

  const userId = users[0].id;
  const slug = "test-galeri-" + Math.floor(Math.random() * 1000);

  const { error } = await supabase
    .from("profiles")
    .update({
      user_type: "professional",
      business_name: "Test Otomotiv",
      business_slug: slug,
      business_description: "Güvenilir araçların adresi.",
      verified_business: true,
    })
    .eq("id", userId);

  if (error) console.error("Error mocking gallery:", error);
  else console.log(`Gallery created! View at: /gallery/${slug}`);
}

mockGallery();

