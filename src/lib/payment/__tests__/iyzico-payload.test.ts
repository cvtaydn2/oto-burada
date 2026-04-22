/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";

import { IyzicoProvider } from "../iyzico";
import { PaymentRequest } from "../types";

// Mock config
vi.mock("../config", () => ({
  isPaymentEnabled: vi.fn(() => true),
}));

// Mock Iyzipay
vi.mock("iyzipay", () => {
  return {
    default: class {
      checkoutFormInitialize = {
        create: vi.fn((data, cb) =>
          cb(null, { status: "success", token: "test-token", paymentPageUrl: "https://test.url" })
        ),
      };
    },
  };
});

describe("Iyzico Payload Mapping", () => {
  const provider = new IyzicoProvider();

  const validRequest: PaymentRequest = {
    amount: 100,
    orderId: "ORDER-1",
    listingId: "LISTING-1",
    userId: "USER-1",
    buyer: {
      id: "USER-1",
      name: "Cevat",
      surname: "Aydin",
      email: "cevat@example.com",
      gsmNumber: "+905321234567",
      address: "Test Adresi 123",
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
      ip: "192.168.1.1",
      registrationDate: "2023-01-01 10:00:00",
      lastLoginDate: "2023-04-20 12:00:00",
    },
  };

  it("should map buyer fields correctly to Iyzico structure", async () => {
    const createSpy = vi.spyOn(provider["iyzipay"]!.checkoutFormInitialize, "create");

    await provider.processPayment(validRequest);

    const payload = createSpy.mock.calls[0][0];

    expect(payload.buyer.name).toBe("Cevat");
    expect(payload.buyer.surname).toBe("Aydin");
    expect(payload.buyer.email).toBe("cevat@example.com");
    expect(payload.buyer.gsmNumber).toBe("+905321234567");
    expect(payload.buyer.registrationAddress).toBe("Test Adresi 123");
    expect(payload.buyer.ip).toBe("192.168.1.1");
    expect(payload.buyer.city).toBe("Istanbul");
    expect(payload.shippingAddress.contactName).toBe("Cevat Aydin");
    expect(payload.billingAddress.contactName).toBe("Cevat Aydin");
  });

  it("should fail validation if buyer info is missing", async () => {
    const invalidRequest = { ...validRequest, buyer: undefined };
    const result = await provider.processPayment(invalidRequest as any);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Müşteri bilgileri eksik");
  });

  it("should match snapshot for payment init payload", async () => {
    const createSpy = vi.spyOn(provider["iyzipay"]!.checkoutFormInitialize, "create");

    await provider.processPayment(validRequest);

    const payload = createSpy.mock.calls[0][0];

    // We remove dynamic dates if any, but in this case validRequest has static ones
    expect(payload).toMatchSnapshot();
  });
});
