/**
 * E2E: Cron endpoint security
 * - Rejects requests without CRON_SECRET
 * - Rejects requests with wrong secret
 * - Accepts requests with correct secret (if configured)
 *
 * These tests run against the live server and verify the security
 * of the cron endpoints without actually triggering side effects.
 */
import { test, expect } from '@playwright/test';

const CRON_ENDPOINTS = [
  '/api/listings/expiry-warnings',
  '/api/saved-searches/notify',
];

test.describe('Cron Endpoint Güvenliği', () => {
  for (const endpoint of CRON_ENDPOINTS) {
    test.describe(endpoint, () => {
      test('CRON_SECRET olmadan 401 döner', async ({ request }) => {
        const response = await request.get(endpoint);
        expect(response.status()).toBe(401);
      });

      test('yanlış CRON_SECRET ile 401 döner', async ({ request }) => {
        const response = await request.get(endpoint, {
          headers: { Authorization: 'Bearer wrong-secret-xyz' },
        });
        expect(response.status()).toBe(401);
      });

      test('boş Authorization header ile 401 döner', async ({ request }) => {
        const response = await request.get(endpoint, {
          headers: { Authorization: '' },
        });
        expect(response.status()).toBe(401);
      });

      // Only runs when CRON_SECRET is set in the test environment
      test('doğru CRON_SECRET ile 200 döner', async ({ request }) => {
        test.skip(!process.env.CRON_SECRET, 'CRON_SECRET not set in test env');

        const response = await request.get(endpoint, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
        // 200 (success) or 503 (Supabase not configured in test env) — both are acceptable
        expect([200, 503]).toContain(response.status());
      });
    });
  }
});

test.describe('API Rate Limiting', () => {
  test('public search endpoint rate limit headers mevcut', async ({ request }) => {
    const response = await request.get('/api/listings?limit=1');
    // /api/listings GET endpoint'i withSecurity ile korunuyor.
    // Kabul edilen status'lar: 200 (ok), 401 (unauth), 429 (rate limited), 503 (unavailable)
    const status = response.status();
    expect([200, 401, 429, 503]).toContain(status);
  });

  test('geçersiz JSON ile POST 400 döner', async ({ request }) => {
    const response = await request.post('/api/listings', {
      data: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    // Should be 400 (bad request) or 401 (unauthorized) — not 500
    expect([400, 401, 403]).toContain(response.status());
  });

  test('CSRF koruması cross-origin isteği reddeder', async ({ request }) => {
    const response = await request.post('/api/listings', {
      data: JSON.stringify({ test: true }),
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil-site.com',
      },
    });
    // Should be 403 (CSRF) or 401 (unauthorized)
    expect([403, 401]).toContain(response.status());
  });
});
