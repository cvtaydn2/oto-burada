# Smoke Report (2026-05-01)

## Scope
- Command: `npm run test:e2e:chromium`
- Environment: local dev server + Playwright Chromium

## Result
- Total tests: `121`
- Status: **Failed** (not release-blocking for all routes, but blocks "fully verified" claim)

## Key Failures
1. **404 accessibility selector mismatch**
   - Spec expects `#not-found-heading` on unknown route page.
2. **Listing detail route timeouts**
   - Multiple tests timed out on `/listing/[slug]`.
3. **Data fetch instability during E2E**
   - Repeated `Listing query failed: TypeError: fetch failed` from listing query layer.

## Interpretation
- Current build/lint/typecheck are stable.
- Production-like functional confidence is not yet complete due to data-layer instability under E2E load.

## Recommended Next Fix Sprint
1. Stabilize listing query fallback behavior under transient fetch failures.
2. Align 404 UI markup with a11y test expectations (or update spec if UI intentionally changed).
3. Add a minimal deterministic seed path for E2E listing-detail tests.
