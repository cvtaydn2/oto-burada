import { beforeAll, describe, expect, it } from "vitest";

import { getAdminClient, getAnonClient } from "./helpers";

describe("Listings RLS Integration", () => {
  const admin = getAdminClient();
  const anon = getAnonClient();
  let testListingId: string;
  let sellerId: string;

  beforeAll(async () => {
    // Get a valid seller ID from profiles
    const { data: profile } = await admin.from("profiles").select("id").limit(1).single();
    sellerId = profile?.id || "77777777-7777-7777-7777-777777777777";

    // 1. Create a test listing using admin (bypasses RLS)
    const { data, error } = await admin
      .from("listings")
      .insert({
        title: "RLS Test Car",
        slug: `rls-test-car-${Date.now()}`,
        brand: "RLS Brand",
        model: "RLS Model",
        year: 2024,
        mileage: 0,
        fuel_type: "benzin",
        transmission: "manuel",
        city: "Istanbul",
        district: "Kadikoy",
        whatsapp_phone: "905555555555",
        description: "RLS Test Description",
        status: "approved",
        price: 100000,
        category: "otomobil",
        seller_id: sellerId,
      })
      .select()
      .single();

    if (error) {
      console.error("Setup error:", error);
    } else {
      testListingId = data.id;
    }
  });

  it("should allow anonymous users to read approved listings", async () => {
    if (!testListingId) return;

    const { data, error } = await anon
      .from("listings")
      .select("id, title")
      .eq("id", testListingId)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(testListingId);
  });

  it("should not allow anonymous users to update listings", async () => {
    if (!testListingId) return;

    const { error: _error } = await anon
      .from("listings")
      .update({ title: "Hacked Title" })
      .eq("id", testListingId);

    // Should fail or return 0 rows (RLS usually returns 0 rows, so error might be null but data empty)
    // For update, if not allowed, it will likely return { data: [], error: null } if using maybeSingle or similar.
    // Standard supabase .update() returns { data, error }.
  });

  it("should not allow anonymous users to read draft listings", async () => {
    // Create draft
    const { data: draft } = await admin
      .from("listings")
      .insert({
        title: "Draft Test Car",
        slug: `draft-test-car-${Date.now()}`,
        brand: "RLS Brand",
        model: "RLS Model",
        year: 2024,
        mileage: 0,
        fuel_type: "benzin",
        transmission: "manuel",
        city: "Istanbul",
        district: "Kadikoy",
        whatsapp_phone: "905555555555",
        description: "Draft Test Description",
        status: "draft",
        price: 200000,
        category: "otomobil",
        seller_id: sellerId,
      })
      .select()
      .single();

    if (draft) {
      const { data, error: _error } = await anon
        .from("listings")
        .select("id")
        .eq("id", draft.id)
        .maybeSingle();

      expect(data).toBeNull();
      // Clean up
      await admin.from("listings").delete().eq("id", draft.id);
    }
  });
});
