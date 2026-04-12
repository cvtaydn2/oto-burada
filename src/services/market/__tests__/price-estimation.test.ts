import { describe, it, expect } from "vitest";
import { calculateValuation } from "../price-estimation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CustomMatchers<R = any> {
  toBeRelativeCloseTo(expected: number, precision?: number): R;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

describe("Price Estimation Logic", () => {
  const baseAvg = 1000000; // 1M TL
  const currentYear = new Date().getFullYear();

  it("should return base average if all parameters match expected values", () => {
    // Expected mileage for 0 year old car is 0.
    const result = calculateValuation(baseAvg, {
      year: currentYear,
      mileage: 0,
    });
    expect(result).toBe(baseAvg);
  });

  it("should decrease price for high mileage", () => {
    // 10.000 km extra -> 1.2% drop (0.012)
    const result = calculateValuation(baseAvg, {
      year: currentYear,
      mileage: 10000,
    });
    expect(result).toBe(baseAvg * 0.988);
  });

  it("should increase price for lower than expected mileage", () => {
    // Car is 1 year old. Expected: 15.000km. Actual: 5.000km.
    // Diff: -10.000km -> -1.2% drop -> +1.2% increase
    const result = calculateValuation(baseAvg, {
      year: currentYear - 1,
      mileage: 5000,
    });
    expect(result).toBe(baseAvg * 1.012);
  });

  it("should apply tramer adjustment (capped at 20%)", () => {
    // 100.000 TL tramer -> 1.5% * 10 = 15% drop
    const resultWithTramer = calculateValuation(baseAvg, {
      year: currentYear,
      mileage: 0,
      tramerAmount: 100000,
    });
    expect(resultWithTramer).toBe(baseAvg * 0.85);

    // 200.000 TL tramer -> 30% calculate but 20% capped
    const resultWithHighTramer = calculateValuation(baseAvg, {
      year: currentYear,
      mileage: 0,
      tramerAmount: 200000,
    });
    expect(resultWithHighTramer).toBe(baseAvg * 0.80);
  });

  it("should apply damage adjustment (capped at 25%)", () => {
    // 5 parts damaged -> 5 * 1.8% = 9% drop
    const damageStatus = {
      hood: "painted",
      door_fl: "changed",
      door_fr: "painted",
      fender_fl: "painted",
      fender_fr: "changed",
    };
    const result = calculateValuation(baseAvg, {
      year: currentYear,
      mileage: 0,
      damageStatusJson: damageStatus,
    });
    expect(result).toBeRelativeCloseTo(baseAvg * 0.91);
  });

  it("should combine all adjustments correctly", () => {
    // 10.000km extra (1.2%) + 100k Tramer (15%) + 5 parts damage (9%)
    // Base 1M -> Mileage adj (988k) -> (988k * (1 - 0.15 - 0.09)) = 988k * 0.76 = 750,880
    const damageStatus = {
      p1: "painted", p2: "painted", p3: "painted", p4: "painted", p5: "painted"
    };
    const result = calculateValuation(baseAvg, {
        year: currentYear,
        mileage: 10000,
        tramerAmount: 100000,
        damageStatusJson: damageStatus
    });
    expect(result).toBe(750880);
  });
});

// Helper for float precision
expect.extend({
  toBeRelativeCloseTo(received: number, expected: number, precision = 2) {
    const pass = Math.abs(received - expected) < 1; // within 1 TL
    if (pass) {
      return { message: () => `expected ${received} to be close to ${expected}`, pass: true };
    } else {
      return { message: () => `expected ${received} to be close to ${expected}, diff ${Math.abs(received - expected)}`, pass: false };
    }
  }
});