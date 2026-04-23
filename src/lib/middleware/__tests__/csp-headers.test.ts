/**
 * Bug 9: CSP is too permissive in production
 *
 * Verifies that 'unsafe-eval' is NOT present in production script-src,
 * and that it IS present in development (for hot-reload tooling).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSecurityHeaders } from "../headers";

describe("CSP Headers — unsafe-eval policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does NOT include unsafe-eval in production script-src", () => {
    vi.stubEnv("NODE_ENV", "production");

    const headers = getSecurityHeaders("test-nonce");
    const csp = headers["Content-Security-Policy"];

    const scriptSrcMatch = csp.match(/script-src ([^;]+)/);
    expect(scriptSrcMatch).not.toBeNull();
    const scriptSrc = scriptSrcMatch![1];

    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("includes unsafe-eval in development script-src (for hot-reload)", () => {
    vi.stubEnv("NODE_ENV", "development");

    const headers = getSecurityHeaders("test-nonce");
    const csp = headers["Content-Security-Policy"];

    expect(csp).toContain("'unsafe-eval'");
  });

  it("always includes nonce in script-src", () => {
    const nonce = "my-test-nonce-123";
    const headers = getSecurityHeaders(nonce);
    const csp = headers["Content-Security-Policy"];

    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it("always includes frame-ancestors none", () => {
    const headers = getSecurityHeaders("nonce");
    const csp = headers["Content-Security-Policy"];
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
