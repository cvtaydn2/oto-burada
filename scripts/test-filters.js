#!/usr/bin/env node

/**
 * OtoBurada Listing Filter Test
 * Tests filtering and search functionality
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testListingsFilters() {
  console.log("\n🔍 Testing Listings Filters");
  console.log("=".repeat(50));

  // Get initial listings
  const res = await fetch(`${API_BASE}/api/listings`);
  const listings = await res.json();

  console.log(`Total listings: ${listings.length || 0}`);

  // Test URL filters
  const filterTests = [
    { url: "/listings", desc: "No filter" },
    { url: "/listings?brand=BMW", desc: "Brand filter" },
    { url: "/listings?city=Istanbul", desc: "City filter" },
    { url: "/listings?brand=Mercedes-Benz&transmission=automatic", desc: "Multiple filters" },
    { url: "/listings?minPrice=500000&maxPrice=1000000", desc: "Price range" },
    { url: "/listings?sort=price_asc", desc: "Sort price asc" },
    { url: "/listings?sort=year_desc", desc: "Sort year desc" },
  ];

  for (const test of filterTests) {
    const start = Date.now();
    const res = await fetch(`${API_BASE}${test.url}`);
    const duration = Date.now() - start;
    console.log(`${test.desc}: ${res.status} (${duration}ms)`);
  }

  console.log("\n✅ Filter tests completed!\n");
}

testListingsFilters().catch(console.error);

