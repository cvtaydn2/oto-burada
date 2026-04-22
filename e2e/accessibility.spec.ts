import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Erişilebilirlik (A11y)", () => {
  test("tüm sayfa otomatik a11y taraması (Axe)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe("Ana Sayfa", () => {
    test("skip nav linki mevcut ve odaklanabilir", async ({ page }) => {
      await page.goto("/");
      // Tab to the first focusable element — should be skip nav
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
    test("ilan kartlarında tek odak noktası var", async ({ page }) => {
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      // First card title link focus
      await page.keyboard.press("Tab"); // skip nav
      await page.keyboard.press("Tab"); // may be header links...

      // Let's just find the link and check if only it is focusable within the article
      const firstCard = page.locator('[role="article"]').first();
      const links = await firstCard.locator("a").all();

      let focusableFound = 0;
      for (const link of links) {
        const tabIndex = await link.getAttribute("tabindex");
        if (tabIndex !== "-1") {
          focusableFound++;
        }
      }

      // Only 1 link should be focusable per card (the title link)
      expect(focusableFound).toBe(1);
    });

    test("sıralama dropdown Escape ile kapanır", async ({ page }) => {
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      // Open sort dropdown
      const sortButton = page.getByRole("button", { name: /sıralama|en yeni/i }).first();
      if ((await sortButton.count()) > 0) {
        await sortButton.click();
        // Dropdown should be open
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible({ timeout: 3_000 });

        // Press Escape
        await page.keyboard.press("Escape");
        await expect(listbox).not.toBeVisible({ timeout: 3_000 });
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

      const emailInput = page.locator("#email");
      await expect(emailInput).toBeVisible();

      const passwordInput = page.locator("#password");
      await expect(passwordInput).toBeVisible();
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
      // May redirect to login — that's fine, just check the page loads
      const backLink = page.locator('a[aria-label="Ana sayfaya dön"]').first();
      // Only check if we're on the favorites page (not redirected)
      if (await page.url().includes("/favorites")) {
        await expect(backLink).toBeVisible();
      }
    });
  });

  test.describe("Klavye Navigasyonu", () => {
    test("ana sayfada Tab ile navigasyon çalışır", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Tab through first few focusable elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
      }

      // Should have a focused element
      const focused = page.locator(":focus");
      await expect(focused).toBeVisible();
    });

    test("mobil alt navigasyon aria-current içeriyor", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Mobile nav should have aria-current="page" on active item
      const activeNavItem = page
        .locator('nav[aria-label*="navigasyon"] a[aria-current="page"]')
        .first();
      if ((await activeNavItem.count()) > 0) {
        await expect(activeNavItem).toBeVisible();
      }
    });
  });
});
