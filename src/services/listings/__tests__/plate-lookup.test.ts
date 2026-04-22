import { describe, expect, it } from "vitest";

import { lookupVehicleByPlate } from "../plate-lookup";

describe("plate-lookup service", () => {
  it("should return null for invalid plate formats", async () => {
    const invalidPlates = [
      "ABC",
      "123",
      "99 AAA 123", // Invalid city code (>81)
      "34 123 123", // Missing letters
      "34 A 1", // Too few numbers
    ];

    for (const plate of invalidPlates) {
      const result = await lookupVehicleByPlate(plate);
      expect(result).toBeNull();
    }
  });

  it("should return vehicle data for valid plate formats", async () => {
    const validPlates = ["34 ABC 123", "06 A 12345", "35 AZ 1234", "01 AAA 12"];

    for (const plate of validPlates) {
      const result = await lookupVehicleByPlate(plate);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("brand");
      expect(result).toHaveProperty("model");
      expect(result?.year).toBeGreaterThanOrEqual(2020);
    }
  });

  it("should be case-insensitive and ignore spaces", async () => {
    const plate = "34 abc 123";
    const result = await lookupVehicleByPlate(plate);
    expect(result).not.toBeNull();
    expect(result?.brand).toBe("BMW"); // Based on mock
  });
});
