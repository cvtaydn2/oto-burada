import { describe, expect, it } from "vitest";

import { getDisposableDomainCount, isDisposableEmail } from "../email-validation";

describe("Email Validation (Disposable Filter)", () => {
  it("should detect known disposable domains", () => {
    expect(isDisposableEmail("test@yopmail.com")).toBe(true);
    expect(isDisposableEmail("junk@10minutemail.com")).toBe(true);
    expect(isDisposableEmail("spam@guerrillamail.com")).toBe(true);
  });

  it("should allow legitimate email domains", () => {
    expect(isDisposableEmail("user@gmail.com")).toBe(false);
    expect(isDisposableEmail("contact@company.com.tr")).toBe(false);
    expect(isDisposableEmail("admin@outlook.com")).toBe(false);
    expect(isDisposableEmail("me@ceo.net.tr")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(isDisposableEmail("TEST@YOPMAIL.COM")).toBe(true);
    expect(isDisposableEmail("User@Gmail.Com")).toBe(false);
  });

  it("should handle invalid inputs gracefully", () => {
    expect(isDisposableEmail("")).toBe(false);
    expect(isDisposableEmail("not-an-email")).toBe(false);
    // @ts-expect-error - testing invalid input
    expect(isDisposableEmail(null)).toBe(false);
    // @ts-expect-error - testing invalid input
    expect(isDisposableEmail(undefined)).toBe(false);
  });

  it("should handle edge case domains", () => {
    // If we have a domain like "google.com.yopmail.com" it should be blocked
    expect(isDisposableEmail("google.com@yopmail.com")).toBe(true);
  });

  it("should report a valid domain count from config", () => {
    const count = getDisposableDomainCount();
    expect(count).toBeGreaterThan(100);
  });
});
