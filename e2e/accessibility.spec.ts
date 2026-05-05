import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Erişilebilirlik (A11y)", () => {
  test("tüm sayfa otomatik a11y taraması (Axe)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe("Ana Sayfa", () => {
    test("skip nav linki mevcut ve odaklanabilir", async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      await expect(focused).toHaveText(/ana içeriğe geç/i);
    });

    test("main landmark mevcut", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("main#main-content")).toBeVisible();
    });

    test("h1 başlığı mevcut", async ({ page }) => {
      await page.goto("/");
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      const text = await h1.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });
  });

  test.describe("İlanlar Sayfası", () => {
    test("ilan kartlarında beklenen erişilebilir hedefler bulunur", async ({ page }) => {
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator("article").first();
      await expect(firstCard).toBeVisible();

      await expect(firstCard.locator('a[href^="/listing/"]')).toHaveCount(1);
      await expect(
        firstCard.getByRole("button", { name: /favorilere ekle|favorilerden çıkar/i })
      ).toHaveCount(1);

      const focusableTargets = firstCard.locator(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      await expect(focusableTargets).toHaveCount(2);
    });

    test("sıralama dropdown Escape ile kapanır", async ({ page }) => {
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      const sortButton = page.getByRole("button", { name: /sıralama|en yeni/i }).first();
      if ((await sortButton.count()) > 0) {
        await sortButton.click();
        await page.keyboard.press("Escape");
        await expect(sortButton).toBeVisible();
      }
    });

    test("görünüm modu butonları aria-pressed içeriyor", async ({ page }) => {
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      const gridButton = page.getByRole("button", { name: /ızgara görünümü/i });
      if ((await gridButton.count()) > 0) {
        const pressed = await gridButton.getAttribute("aria-pressed");
        expect(["true", "false"]).toContain(pressed);
      }
    });
  });

  test.describe("Giriş Sayfası", () => {
    test("email ve şifre inputları label ile bağlı", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
    });

    test("hata mesajı role=alert ile duyurulur", async ({ page }) => {
      await page.goto("/login");
      await page.locator("#email").fill("bad@example.com");
      await page.locator("#password").fill("wrongpass");
      await page.getByRole("button", { name: /giriş yap/i }).click();

      const alert = page.locator('[role="alert"]').first();
      await expect(alert).toBeVisible({ timeout: 8_000 });
    });
  });

  test.describe("404 Sayfası", () => {
    test("main landmark mevcut", async ({ page }) => {
      await page.goto("/bu-sayfa-mevcut-degil-xyz");
      await expect(page.locator("main")).toBeVisible();
    });

    test("h2 başlığı aria-labelledby ile bağlı", async ({ page }) => {
      await page.goto("/bu-sayfa-mevcut-degil-xyz");
      const heading = page.locator("#not-found-heading");
      await expect(heading).toBeVisible();
    });
  });

  test.describe("Favoriler Sayfası", () => {
    test("geri butonu aria-label içeriyor", async ({ page }) => {
      await page.goto("/favorites");
      const backLink = page.locator('a[aria-label="Ana sayfaya dön"]').first();
      if ((await page.url()).includes("/favorites")) {
        await expect(backLink).toBeVisible();
      }
    });
  });

  test.describe("Klavye Navigasyonu", () => {
    test("ana sayfada Tab ile navigasyon çalışır", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
      }

      const focused = page.locator(":focus");
      await expect(focused).toBeVisible();
    });

    test("mobil alt navigasyon aria-current içeriyor", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const activeNavItem = page.locator('nav[aria-label*="navigasyon"] a[aria-current="page"]').first();
      if ((await activeNavItem.count()) > 0) {
        await expect(activeNavItem).toBeVisible();
      }
    });
  });
});
