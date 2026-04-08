import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load homepage", async ({ page }) => {
    await expect(page).toHaveTitle(/Oto Burada/);
  });

  test("should show hero section with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Hayalindeki Arabayı Bul" })).toBeVisible();
  });

  test("should show listing cards", async ({ page }) => {
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Listings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/listings");
  });

  test("should load listings page", async ({ page }) => {
    await expect(page).toHaveURL(/\/listings/);
  });
});

test.describe("Listing Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/listing/2018-volkswagen-golf-1-6-tdi-comfortline");
  });

  test("should show listing details", async ({ page }) => {
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
  });

  test("should have image", async ({ page }) => {
    await expect(page.locator("img").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Navigation", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
  });

  test("should show compare page", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("API Endpoints", () => {
  test("GET /api/favorites should work without auth", async ({ request }) => {
    const res = await request.get("/api/favorites");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        favoriteIds: [],
      },
    });
  });

  test("POST /api/favorites without auth should return 401", async ({ request }) => {
    const res = await request.post("/api/favorites", {
      data: { listingId: "test-id" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/listings requires auth", async ({ request }) => {
    const res = await request.post("/api/listings", {
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
