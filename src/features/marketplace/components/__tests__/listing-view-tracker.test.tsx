import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListingViewTracker } from "../listing-view-tracker";

const refreshMock = vi.fn();
const captureEventMock = vi.fn();
const captureExceptionMock = vi.fn();

vi.mock("@/features/providers/components/csrf-provider", () => ({
  useCsrfToken: () => ({
    token: "csrf-token-1",
    refresh: refreshMock,
  }),
}));

vi.mock("@/features/shared/lib/telemetry-client", () => ({
  captureClientEvent: (...args: unknown[]) => captureEventMock(...args),
  captureClientException: (...args: unknown[]) => captureExceptionMock(...args),
}));

describe("ListingViewTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  it("mount olduğunda view kaydını bir kez gönderir", async () => {
    const { rerender } = render(
      <ListingViewTracker
        listingId="listing-1"
        listingSlug="bmw-320i"
        brand="BMW"
        model="320i"
        city="Istanbul"
        price={1000000}
        year={2021}
        status="approved"
      />
    );

    rerender(
      <ListingViewTracker
        listingId="listing-1"
        listingSlug="bmw-320i"
        brand="BMW"
        model="320i"
        city="Istanbul"
        price={1000000}
        year={2021}
        status="approved"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/listings/view",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-csrf-token": "csrf-token-1",
        }),
      })
    );

    expect(captureEventMock).toHaveBeenCalledWith(
      "listing_viewed",
      expect.objectContaining({ listingId: "listing-1" })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });
});
