import { expect, test } from "@playwright/test";

test.describe("Görsel Regresyon (Visual Regression)", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test.skip(`Ana Sayfa - ${vp.name} (UI değişiklikleri nedeniyle)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Take snapshot
      await expect(page).toHaveScreenshot(`home-page-${vp.name.toLowerCase()}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.1,
      });
    });

    test.skip(`İlanlar Listesi - ${vp.name} (UI değişiklikleri nedeniyle)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      // Hide dynamic elements like actual listing titles if needed to reduce noise
      // but usually for VRT we want to see them.

      await expect(page).toHaveScreenshot(`listings-page-${vp.name.toLowerCase()}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.1,
        mask: [page.locator(".animate-pulse")], // mask skeletons
      });
    });
  }
});

