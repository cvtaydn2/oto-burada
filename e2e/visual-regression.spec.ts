import { expect, test } from "@playwright/test";

test.describe("Görsel Regresyon (Visual Regression)", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`Ana Sayfa - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for images to load
      await page.waitForSelector("img");

      // Take snapshot
      await expect(page).toHaveScreenshot(`home-page-${vp.name.toLowerCase()}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });

    test(`İlanlar Listesi - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/listings");
      await page.waitForLoadState("networkidle");

      // Hide dynamic elements like actual listing titles if needed to reduce noise
      // but usually for VRT we want to see them.

      await expect(page).toHaveScreenshot(`listings-page-${vp.name.toLowerCase()}.png`, {
        fullPage: true,
        mask: [page.locator(".animate-pulse")], // mask skeletons
      });
    });
  }
});
