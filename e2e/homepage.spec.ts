import { expect, test } from "@playwright/test";

test.describe("Ana Sayfa", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("sayfa başlığı doğru", async ({ page }) => {
    await expect(page).toHaveTitle(/OtoBurada/i);
  });

  test("hero arama kutusu görünür", async ({ page }) => {
    const searchInput = page.locator('input[name="query"]').first();
    await expect(searchInput).toBeVisible();
  });

  test("hero şehir seçici görünür", async ({ page }) => {
    const citySelect = page.locator('select[name="city"]').first();
    await expect(citySelect).toBeVisible();
  });

  test("hero CTA butonu görünür", async ({ page }) => {
    const ctaButton = page.locator('button[type="submit"]').first();
    await expect(ctaButton).toBeVisible();
  });

  test("h1 başlığı mevcut", async ({ page }) => {
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
  });

  test("Yeni İlanlar bölümü görünür", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Yeni İlanlar/i })).toBeVisible();
  });

  test("anasayfa vitrin alanı sponsorlu görünürlük dili ile görünür", async ({ page }) => {
    await expect(page.getByText(/Anasayfa Vitrini/i)).toBeVisible();
    await expect(page.getByText(/sponsorlu görünürlük açıkça etiketlenir/i)).toBeVisible();
  });

  test("footer görünür", async ({ page }) => {
    await expect(page.locator("footer").first()).toBeVisible();
  });
});

test.describe("İlanlar Sayfası", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");
  });

  test("sayfa başlığı görünür", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("ilan kartları veya boş durum görünür", async ({ page }) => {
    test.skip(true, "Relies on live approved listings in database - skipped in isolated test environment");
    const listings = page.locator('a[href^="/listing/"]').first();
    const emptyState = page.getByText("Sonuç bulunamadı");
    await expect(listings.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("filtre paneli desktop'ta görünür", async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    if (viewportWidth < 1024) {
      test.skip();
      return;
    }
    await expect(page.getByRole("heading", { name: /Filtrele/i })).toBeVisible();
  });

  test("mobilde filtre butonu görünür", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/listings");
    await page.waitForLoadState("domcontentloaded");
    const filterTrigger = page.getByRole("button", { name: /filtrele/i }).first();
    const filterText = page.getByText(/filtrele/i).first();
    await expect(filterTrigger.or(filterText)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("İlan Detay Sayfası (Listings'ten)", () => {
  test("ilan detayı yükleniyor", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");

    const firstListing = page.locator('a[href^="/listing/"]').first();
    if ((await firstListing.count()) > 0) {
      const detailHref = await firstListing.getAttribute("href");
      expect(detailHref).toBeTruthy();

      await page.goto(detailHref!);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("Giriş Sayfası", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
  });

  test("giriş formu görünür", async ({ page }) => {
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("kayıt sayfasına yönlendirme çalışır", async ({ page }) => {
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL("/register");
  });

  test("şifremi unuttum linki görünür", async ({ page }) => {
    await expect(page.getByRole("link", { name: /unuttum/i })).toBeVisible();
  });
});

test.describe("Korumalı Rotalar", () => {
  test("yetkisiz kullanıcı dashboard'a giremez", async ({ page }) => {
    await page.goto("/dashboard/listings/create");
    await expect(page).toHaveURL(/\/(login|maintenance)/);
  });

  test("yetkisiz kullanıcı admin'e giremez", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/(login|maintenance)/);
  });
});

test.describe("Mobil Uyumluluk", () => {
  test("mobilde ana sayfa düzgün yükleniyor", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("mobil alt navigasyon görünür", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const mobileNav = page.locator('nav[aria-label*="navigasyon"]').first();
    await expect(mobileNav).toBeVisible();
  });
});

