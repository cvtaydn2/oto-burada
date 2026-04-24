import { describe, expect, it } from "vitest";

import { ListingStatusMachine } from "../logic/listing-status-machine";

describe("ListingStatusMachine", () => {
  it("should transition from draft to pending when publishing", () => {
    const next = ListingStatusMachine.getNextStatus("draft", "publish");
    expect(next).toBe("pending");
  });

  it("should transition from approved to archived when archiving", () => {
    const next = ListingStatusMachine.getNextStatus("approved", "archive");
    expect(next).toBe("archived");
  });

  it("should not allow transition from approved to pending", () => {
    const next = ListingStatusMachine.getNextStatus("approved", "publish");
    expect(next).toBeNull();
  });

  it("should allow re-publishing from rejected to pending", () => {
    const next = ListingStatusMachine.getNextStatus("rejected", "publish");
    expect(next).toBe("pending");
  });

  it("should check if transition is possible", () => {
    expect(ListingStatusMachine.canTransition("draft", "publish")).toBe(true);
    expect(ListingStatusMachine.canTransition("approved", "publish")).toBe(false);
  });
});
