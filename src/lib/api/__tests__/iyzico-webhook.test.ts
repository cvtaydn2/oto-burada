import crypto from "crypto";
import { describe, expect, it } from "vitest";

import { verifyIyzicoWebhook } from "../iyzico-webhook";

describe("verifyIyzicoWebhook", () => {
  const body = JSON.stringify({ token: "payment-token", status: "SUCCESS" });
  const secretKey = "test-secret-key";
  const validSignature = crypto.createHmac("sha256", secretKey).update(body).digest("base64");

  it("should accept a valid webhook signature", () => {
    expect(verifyIyzicoWebhook(body, validSignature, secretKey)).toBe(true);
  });

  it("should reject a missing signature", () => {
    expect(verifyIyzicoWebhook(body, null, secretKey)).toBe(false);
  });

  it("should reject signatures with mismatched lengths", () => {
    expect(verifyIyzicoWebhook(body, "short", secretKey)).toBe(false);
  });

  it("should reject invalid base64 payloads without throwing", () => {
    expect(verifyIyzicoWebhook(body, "!!!!", secretKey)).toBe(false);
  });

  it("should reject a tampered signature", () => {
    const tamperedSignature = crypto
      .createHmac("sha256", "different-secret")
      .update(body)
      .digest("base64");

    expect(verifyIyzicoWebhook(body, tamperedSignature, secretKey)).toBe(false);
  });
});
