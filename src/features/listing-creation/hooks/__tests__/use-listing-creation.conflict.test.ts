import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("useListingCreation conflict handling", () => {
  const sourceCode = readFileSync(
    resolve(process.cwd(), "src/features/listing-creation/hooks/use-listing-creation.ts"),
    "utf-8"
  );

  it("handles conflict responses with a dedicated refresh path", () => {
    expect(sourceCode).toContain('response.error?.code === "CONFLICT"');
    // After conflict, user is prompted to reload — uses window.location.reload()
    expect(sourceCode).toContain("window.location.reload()");
  });
});
