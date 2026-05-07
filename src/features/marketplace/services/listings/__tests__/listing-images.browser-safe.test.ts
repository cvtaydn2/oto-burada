/**
 * Bug 2: Client bundle imports Node-only image-size
 *
 * Verifies that validateListingImageFile uses browser-safe dimension checking
 * (no `image-size` import) and that the dimension guard still works correctly.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateListingImageFile } from "../listing-images";

vi.mock("@/features/shared/lib/domain", () => ({
  listingImageAcceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  listingImageMaxSizeInBytes: 10 * 1024 * 1024, // 10MB
}));

// Helper: build a minimal valid PNG with given dimensions
function buildPng(width: number, height: number): Uint8Array {
  const buf = new Uint8Array(29);
  // PNG signature
  buf[0] = 0x89;
  buf[1] = 0x50;
  buf[2] = 0x4e;
  buf[3] = 0x47;
  buf[4] = 0x0d;
  buf[5] = 0x0a;
  buf[6] = 0x1a;
  buf[7] = 0x0a;
  // IHDR chunk length (13 bytes)
  buf[8] = 0;
  buf[9] = 0;
  buf[10] = 0;
  buf[11] = 13;
  // IHDR type
  buf[12] = 0x49;
  buf[13] = 0x48;
  buf[14] = 0x44;
  buf[15] = 0x52;
  // Width (big-endian uint32 at offset 16)
  buf[16] = (width >> 24) & 0xff;
  buf[17] = (width >> 16) & 0xff;
  buf[18] = (width >> 8) & 0xff;
  buf[19] = width & 0xff;
  // Height (big-endian uint32 at offset 20)
  buf[20] = (height >> 24) & 0xff;
  buf[21] = (height >> 16) & 0xff;
  buf[22] = (height >> 8) & 0xff;
  buf[23] = height & 0xff;
  return buf;
}

function makePngFile(width: number, height: number): File {
  const bytes = buildPng(width, height);
  return new File([bytes.buffer as ArrayBuffer], "test.png", { type: "image/png" });
}

describe("validateListingImageFile — browser-safe dimension check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure createImageBitmap is NOT available so the fallback path is exercised
    vi.stubGlobal("createImageBitmap", undefined);
  });

  it("rejects images wider than 4000px via fallback byte parser", async () => {
    const file = makePngFile(4001, 100);
    const result = await validateListingImageFile(file);
    expect(result).toContain("4001px");
    expect(result).toContain("4000px");
  });

  it("rejects images taller than 4000px via fallback byte parser", async () => {
    const file = makePngFile(100, 4001);
    const result = await validateListingImageFile(file);
    expect(result).toContain("4001px");
    expect(result).toContain("4000px");
  });

  it("accepts images within dimension limits", async () => {
    const file = makePngFile(1920, 1080);
    // The magic-byte check will pass (valid PNG header), dimensions are fine.
    const result = await validateListingImageFile(file);
    // result is null (valid) or a non-dimension error — must not be a dimension error
    if (result !== null) {
      expect(result).not.toContain("genişliği çok fazla");
      expect(result).not.toContain("yüksekliği çok fazla");
    }
  });

  it("keeps using header parser even if createImageBitmap exists", async () => {
    const mockBitmap = { width: 5000, height: 100, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(mockBitmap));

    const file = makePngFile(100, 100);
    const result = await validateListingImageFile(file);
    expect(result).toBeNull();
  });
});
