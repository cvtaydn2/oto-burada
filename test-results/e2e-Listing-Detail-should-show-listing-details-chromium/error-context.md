# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Listing Detail >> should show listing details
- Location: tests\e2e.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading').first()

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Homepage", () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto("/");
  6   |   });
  7   | 
  8   |   test("should load homepage", async ({ page }) => {
  9   |     await expect(page).toHaveTitle(/Oto Burada/);
  10  |   });
  11  | 
  12  |   test("should show hero section with heading", async ({ page }) => {
  13  |     await expect(page.getByRole("heading", { name: "Hayalindeki Arabayı Bul" })).toBeVisible();
  14  |   });
  15  | 
  16  |   test("should show listing cards", async ({ page }) => {
  17  |     await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  18  |   });
  19  | });
  20  | 
  21  | test.describe("Listings Page", () => {
  22  |   test.beforeEach(async ({ page }) => {
  23  |     await page.goto("/listings");
  24  |   });
  25  | 
  26  |   test("should load listings page", async ({ page }) => {
  27  |     await expect(page).toHaveURL(/\/listings/);
  28  |   });
  29  | 
  30  |   test("should show save search call-to-action for guests", async ({ page }) => {
  31  |     await expect(page.getByRole("link", { name: /Giris yap ve aramayi kaydet/i })).toBeVisible();
  32  |   });
  33  | });
  34  | 
  35  | test.describe("Listing Detail", () => {
  36  |   test.beforeEach(async ({ page }) => {
  37  |     await page.goto("/listing/2018-volkswagen-golf-1-6-tdi-comfortline");
  38  |   });
  39  | 
  40  |   test("should show listing details", async ({ page }) => {
> 41  |     await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  42  |   });
  43  | 
  44  |   test("should have image", async ({ page }) => {
  45  |     await expect(page.locator("img").first()).toBeVisible({ timeout: 10000 });
  46  |   });
  47  | });
  48  | 
  49  | test.describe("Navigation", () => {
  50  |   test("should navigate to login page", async ({ page }) => {
  51  |     await page.goto("/login");
  52  |     await expect(page).toHaveURL(/login/);
  53  |   });
  54  | 
  55  |   test("should navigate to register page", async ({ page }) => {
  56  |     await page.goto("/register");
  57  |     await expect(page).toHaveURL(/register/);
  58  |   });
  59  | 
  60  |   test("should show compare page", async ({ page }) => {
  61  |     await page.goto("/compare");
  62  |     await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
  63  |   });
  64  | 
  65  |   test("should show public favorites page for guests", async ({ page }) => {
  66  |     await page.goto("/");
  67  |     const favoriteButton = page.locator("button[aria-label='Favorilere ekle']:visible").first();
  68  |     await expect(favoriteButton).toBeEnabled({ timeout: 10000 });
  69  |     await favoriteButton.click();
  70  |     await page.goto("/favorites");
  71  |     await expect(page).toHaveURL(/\/favorites/);
  72  |     await expect(page.getByRole("heading", { name: "Kaydettigin ilanlar" })).toBeVisible();
  73  |     await expect(page.getByText("Favorilerin bu cihazda saklanir")).toBeVisible();
  74  |     await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  75  |   });
  76  | });
  77  | 
  78  | test.describe("API Endpoints", () => {
  79  |   test("GET /api/favorites should work without auth", async ({ request }) => {
  80  |     const res = await request.get("/api/favorites");
  81  |     expect(res.status()).toBe(200);
  82  |     const data = await res.json();
  83  |     expect(data).toMatchObject({
  84  |       success: true,
  85  |       data: {
  86  |         favoriteIds: [],
  87  |       },
  88  |     });
  89  |   });
  90  | 
  91  |   test("POST /api/favorites without auth should return 401", async ({ request }) => {
  92  |     const res = await request.post("/api/favorites", {
  93  |       data: { listingId: "test-id" },
  94  |     });
  95  |     expect(res.status()).toBe(401);
  96  |   });
  97  | 
  98  |   test("GET /api/saved-searches without auth should return 401", async ({ request }) => {
  99  |     const res = await request.get("/api/saved-searches");
  100 |     expect(res.status()).toBe(401);
  101 |   });
  102 | 
  103 |   test("POST /api/saved-searches without auth should return 401", async ({ request }) => {
  104 |     const res = await request.post("/api/saved-searches", {
  105 |       data: {
  106 |         filters: { brand: "Volkswagen", sort: "newest" },
  107 |       },
  108 |     });
  109 |     expect(res.status()).toBe(401);
  110 |   });
  111 | 
  112 |   test("GET /api/notifications without auth should return 401", async ({ request }) => {
  113 |     const res = await request.get("/api/notifications");
  114 |     expect(res.status()).toBe(401);
  115 |   });
  116 | 
  117 |   test("PATCH /api/notifications without auth should return 401", async ({ request }) => {
  118 |     const res = await request.patch("/api/notifications");
  119 |     expect(res.status()).toBe(401);
  120 |   });
  121 | 
  122 |   test("POST /api/listings requires auth", async ({ request }) => {
  123 |     const res = await request.post("/api/listings", {
  124 |       data: {},
  125 |     });
  126 |     expect(res.status()).toBeGreaterThanOrEqual(400);
  127 |   });
  128 | });
  129 | 
```