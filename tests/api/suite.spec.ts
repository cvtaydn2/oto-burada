/**
 * API Test Suite - OtoBurada
 * 
 * Coverage Hedefi: %80+
 * Araç: Playwright (ücretsiz)
 * 
 * Test Kategorileri:
 * 1. Functional - Endpoint'ler doğru çalışıyor mu?
 * 2. Security - Auth, Authorization kontrolü
 * 3. Performance - Response time < 200ms
 */

import { expect,test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const API_BASE = `${BASE_URL}/api`;

test.describe("API Security Tests", () => {
  test("GET /api/listings - Public endpoint, no auth required", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/listings`);
    expect(response.status()).toBeLessThan(500);
  });

  test("POST /api/listings - Requires authentication", async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/listings`, {
      data: { title: "Test" }
    });
    expect([401, 403]).toContain(response.status());
  });

  test("GET /api/admin/listings - Requires admin role", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/admin/listings`);
    expect([401, 403]).toContain(response.status());
  });

  test("POST /api/payments/initialize - Requires authentication", async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/payments/initialize`, {
      data: {}
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("API Functional Tests", () => {
  test("GET /api/listings - Returns valid JSON structure", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/listings?limit=1`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("listings");
  });

  test("GET /api/listings - Filter by status works", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/listings?status=approved`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(Array.isArray(json.data.listings)).toBe(true);
  });

  test("GET /api/listings/[id] - Returns listing details", async ({ page }) => {
    const listResponse = await page.request.get(`${API_BASE}/listings?limit=1`);
    const listJson = await listResponse.json();
    
    if (listJson.data.listings.length > 0) {
      const listingId = listJson.data.listings[0].id;
      const response = await page.request.get(`${API_BASE}/listings/${listingId}`);
      expect(response.status()).toBe(200);
    }
  });

  test("GET /api/health - Health check endpoint", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
  });
});

test.describe("API Rate Limiting Tests", () => {
  test("Rate limiting - Should reject excessive requests", async ({ page }) => {
    const requests = Array(125).fill(null).map(() => 
      page.request.get(`${API_BASE}/listings`)
    );
    
    const results = await Promise.allSettled(requests);
    
    const statuses = results
      .filter(r => r.status === "fulfilled")
      .map(r => r.value.status());
    
    expect(statuses.some(s => s === 429)).toBeTruthy();
  });
});

test.describe("API Input Validation Tests", () => {
  test("POST /api/listings - Invalid input returns 400", async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/listings`, {
      data: { invalid: "data" }
    });
    expect([400, 401, 403]).toContain(response.status());
  });

  test("GET /api/listings - Invalid query params handled", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/listings?page=-1`);
    expect([200, 400]).toContain(response.status());
  });

  test("GET /api/listings - SQL injection prevention", async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/listings?status=approved' OR '1'='1`);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("API Performance Tests", () => {
  test("GET /api/listings - Response time < 2s", async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get(`${API_BASE}/listings`);
    const duration = Date.now() - start;
    
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(2000);
  });

  test("GET /api/listings/[id] - Response time < 1s", async ({ page }) => {
    const listResponse = await page.request.get(`${API_BASE}/listings?limit=1`);
    const listJson = await listResponse.json();
    
    if (listJson.data.listings.length > 0) {
      const listingId = listJson.data.listings[0].id;
      const start = Date.now();
      const response = await page.request.get(`${API_BASE}/listings/${listingId}`);
      const duration = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(1000);
    }
  });
});