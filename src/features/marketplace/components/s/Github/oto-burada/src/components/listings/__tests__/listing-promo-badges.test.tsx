import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingPromoBadges } from "@/features/marketplace/components/listing-promo-badges";

describe("ListingPromoBadges", () => {
  it("renders promotional labels from shared items", () => {
    render(
      <ListingPromoBadges
        items={[
          {
            type: "homepage_showcase",
            label: "Anasayfa Vitrini",
            expiresAt: "2026-05-10T12:00:00.000Z",
          },
          { type: "urgent", label: "Acil Acil", expiresAt: "2026-05-07T12:00:00.000Z" },
        ]}
      />
    );

    expect(screen.getByText("Anasayfa Vitrini")).toBeInTheDocument();
    expect(screen.getByText("Acil Acil")).toBeInTheDocument();
  });

  it("respects the limit prop", () => {
    render(
      <ListingPromoBadges
        limit={1}
        items={[
          {
            type: "homepage_showcase",
            label: "Anasayfa Vitrini",
            expiresAt: "2026-05-10T12:00:00.000Z",
          },
          { type: "urgent", label: "Acil Acil", expiresAt: "2026-05-07T12:00:00.000Z" },
        ]}
      />
    );

    expect(screen.getByText("Anasayfa Vitrini")).toBeInTheDocument();
    expect(screen.queryByText("Acil Acil")).toBeNull();
  });

  it("renders nothing when there are no promo items", () => {
    const { container } = render(<ListingPromoBadges items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
