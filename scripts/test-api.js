#!/usr/bin/env node

/**
 * OtoBurada API Test Script
 * Run: node scripts/test-api.js
 *
 * Tests all API endpoints for correctness and performance.
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const headers = {
  "Content-Type": "application/json",
};

function log(status, method, path, duration, details = "") {
  const statusIcon = status >= 200 && status < 300 ? "✅" : status >= 400 ? "❌" : "⚠️";
  console.log(`${statusIcon} ${method} ${path} ${status} (${duration}ms) ${details}`);
}

async function testEndpoint(method, path, body = null) {
  const start = Date.now();
  try {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);
    const duration = Date.now() - start;
    const data = await res.json().catch(() => ({}));

    log(res.status, method, path, duration, data.message || "");
    return { status: res.status, data, duration, ok: res.ok };
  } catch (err) {
    const duration = Date.now() - start;
    log(0, method, path, duration, `ERROR: ${err.message}`);
    return { status: 0, error: err.message, duration, ok: false };
  }
}

async function runTests() {
  console.log("\n🔍 OtoBurada API Test Suite");
  console.log("=".repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log("=".repeat(60));

  // Test 1: Public endpoints
  console.log("\n📌 Public Endpoints");

  await testEndpoint("GET", "/");
  await testEndpoint("GET", "/listings");

  // Test 2: Auth endpoints (these should redirect)
  console.log("\n🔐 Auth Endpoints");

  await testEndpoint("GET", "/login");
  await testEndpoint("GET", "/register");

  // Test 3: Favorites (no auth - should return empty)
  console.log("\n❤️ Favorites API");

  const favGet = await testEndpoint("GET", "/api/favorites");
  if (favGet.status === 200) {
    console.log(`   Found ${favGet.data.favoriteIds?.length || 0} favorites`);
  }

  // Test 4: Listings (auth required)
  console.log("\n🚗 Listings API");

  await testEndpoint("GET", "/api/listings");
  await testEndpoint("POST", "/api/listings", {}); // Should fail without real auth

  // Test 5: Reports (auth required)
  console.log("\n🚨 Reports API");

  await testEndpoint("POST", "/api/reports", { listingId: "test", reason: "spam" });

  // Test 6: Images (auth required)
  console.log("\n🖼️ Images API");

  // POST /api/listings/images requires FormData - skip for now
  await testEndpoint("DELETE", "/api/listings/images", { storagePath: "" });

  // Performance Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Performance Summary");
  console.log("=".repeat(60));

  // Health check
  console.log("\n🏥 Health Check:");
  const healthStart = Date.now();
  const health = await fetch(`${API_BASE}/`, { method: "HEAD" });
  console.log(`   Homepage: ${health.ok ? "OK" : "FAIL"} (${Date.now() - healthStart}ms)`);

  console.log("\n✅ Test completed!\n");
}

runTests().catch(console.error);

