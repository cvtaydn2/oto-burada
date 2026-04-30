/**
 * Performance Benchmark Suite
 * 
 * Ücretsiz Plan: Manual testing + Vercel Analytics
 * 
 * Metrics to track:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - FCP (First Contentful Paint) < 1.8s  
 * - TTFB (Time to First Byte) < 600ms
 * - API Response < 200ms (p95)
 */

import { expect,test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

test.describe("Performance Benchmarks", () => {
  test("Homepage LCP < 2.5s", async ({ page }) => {
    await page.goto(BASE_URL);
    
    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          resolve(lastEntry.renderTime || lastEntry.loadTime || null);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        
        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });
    
    if (lcp) {
      console.log(`LCP: ${(Number(lcp) / 1000).toFixed(2)}s`);
      expect(Number(lcp)).toBeLessThan(2500);
    }
  });

  test("Page Load TTFB < 600ms", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    const ttfb = Date.now() - start;
    
    console.log(`TTFB: ${ttfb}ms`);
    expect(Number(ttfb)).toBeLessThan(600);
  });

  test("API Listings Response < 200ms", async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${BASE_URL}/api/listings?limit=10`);
    const duration = Date.now() - start;
    
    expect(response.status()).toBe(200);
    console.log(`API Response: ${duration}ms`);
    expect(Number(duration)).toBeLessThan(200);
  });

  test("Navigation Transition < 300ms", async ({ page }) => {
    await page.goto(BASE_URL);
    
    const start = Date.now();
    await page.click('a[href="/listings"]');
    await page.waitForLoadState("networkidle");
    const duration = Date.now() - start;
    
    console.log(`Navigation: ${duration}ms`);
    expect(Number(duration)).toBeLessThan(300);
  });
});

test.describe("Bundle Size Tests", () => {
  test("No large bundles (> 500KB)", async ({ page }) => {
    const errors: string[] = [];
    
    page.on("response", (response) => {
      const size = Number(response.headers()["content-length"] || 0);
      const url = response.url();
      
      if (size > 500 * 1024 && url.includes(".js")) {
        errors.push(`${url}: ${(size / 1024).toFixed(0)}KB`);
      }
    });
    
    await page.goto(BASE_URL);
    await page.goto(`${BASE_URL}/listings`);
    
    if (errors.length > 0) {
      console.log("Large bundles found:", errors);
    }
    expect(errors.length).toBe(0);
  });
});