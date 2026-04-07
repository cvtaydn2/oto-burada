import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load homepage", async ({ page }) => {
    await expect(page).toHaveTitle(/OtoBurada/i);
  });

  test("should show hero section", async ({ page }) => {
    await expect(page.locator("text=Hayalindeki Arabayı Bul")).toBeVisible();
  });

  test("should have working search", async ({ page }) => {
    await page.locator('input[type="search"]').fill("Volkswagen");
    await page.keyboard.press("Enter");
    await expect(page.url()).toContain("query=Volkswagen");
  });

  test("should show listing cards", async ({ page }) => {
    await expect(page.locator("article").first()).toBeVisible();
  });
});

test.describe("Listings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/listings");
  });

  test("should display listings", async ({ page }) => {
    await expect(page.locator("text=Otomobil İlanları")).toBeVisible();
  });

  test("should toggle view mode", async ({ page }) => {
    await page.locator('button[title="Izgara görünümü"]').click();
    await expect(page.locator(".grid")).toBeVisible();
  });

  test("should sort by price", async ({ page }) => {
    await page.locator("text=Fiyat").click();
    await expect(page.url()).toContain("sort");
  });
});

test.describe("Listing Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/listing/2018-volkswagen-golf-1-6-tdi-comfortline");
  });

  test("should show listing details", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Volkswagen");
  });

  test("should have WhatsApp CTA", async ({ page }) => {
    await expect(page.locator('a:has-text("WhatsApp")')).toBeVisible();
  });

  test("should have image gallery", async ({ page }) => {
    await expect(page.locator("[aria-label='Önceki görsel']")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate to login", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Giriş");
    await expect(page.url()).toContain("/login");
  });

  test("should navigate to register", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Kayıt Ol");
    await expect(page.url()).toContain("/register");
  });

  test("should navigate to compare page", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.locator("text=Araç Karşılaştırma")).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/listings");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should have working skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator("a, button").first()).toBeFocused();
  });

  test("should have proper alt text on images", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    if (count > 0) {
      const firstImage = images.first();
      const alt = await firstImage.getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });
});

test.describe("Mobile Responsive", () => {
  test("should show mobile navigation on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("text=Menüyü aç")).toBeVisible();
  });
});