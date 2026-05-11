/**
 * Bug 9: CSP is too permissive in production
 *
 * Verifies that 'unsafe-eval' is NOT present in production script-src,
 * and that it IS present in development (for hot-reload tooling).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSecurityHeaders } from "../headers";

describe("CSP Headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does NOT include unsafe-eval in production script-src", () => {
    vi.stubEnv("NODE_ENV", "production");

    const headers = getSecurityHeaders("test-nonce");
    const csp = headers["Content-Security-Policy"];
    expect(csp).toBeDefined();

    const scriptSrcMatch = csp!.match(/script-src ([^;]+)/);
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

  it("always includes nonce in script-src (production)", () => {
    vi.stubEnv("NODE_ENV", "production");
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

  it("uses unsafe-inline instead of nonce for style-src (production)", () => {
    vi.stubEnv("NODE_ENV", "production");
    const headers = getSecurityHeaders("test-nonce");
    const csp = headers["Content-Security-Policy"];

    const styleSrcMatch = csp!.match(/style-src ([^;]+)/);
    expect(styleSrcMatch).not.toBeNull();
    const styleSrc = styleSrcMatch![1];

    expect(styleSrc).toContain("'unsafe-inline'");
    expect(styleSrc).not.toContain("'nonce-");
  });
});
