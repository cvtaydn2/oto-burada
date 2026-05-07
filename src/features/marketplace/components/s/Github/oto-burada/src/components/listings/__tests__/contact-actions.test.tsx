import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactActions } from "../contact-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/dashboard/listings/actions", () => ({
  revealListingPhone: vi.fn(),
}));

vi.mock("@/features/offers/components/offer-panel", () => ({
  OfferPanel: () => <div data-testid="offer-panel" />,
}));

vi.mock("@/features/marketplace/lib/trust-ui", () => ({
  getSellerTrustUI: (seller: { blocked?: boolean } | null | undefined) => {
    if (seller?.blocked) {
      return {
        isContactable: false,
        isTrusted: false,
        label: "İletişim Kısıtlı",
        subMessage: "Bu satıcıyla iletişim şu anda kapalı.",
        tone: "amber",
      };
    }

    return {
      isContactable: true,
      isTrusted: true,
      label: "Güvenilir",
      subMessage: "",
      tone: "emerald",
    };
  },
}));

describe("ContactActions", () => {
  it("ilan sahibi için self-state gösterir", () => {
    render(<ContactActions listingId="l1" sellerId="u1" currentUserId="u1" seller={null} />);

    expect(screen.getByText(/Bu Sizin İlanınız/i)).toBeInTheDocument();
  });

  it("contactable kullanıcı için WhatsApp-first CTA gösterir", () => {
    render(
      <ContactActions listingId="l1" sellerId="seller-1" currentUserId="viewer-1" seller={{}} />
    );

    expect(screen.getByRole("button", { name: /WhatsApp ile Yaz/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mesaj Gönder/i })).toBeInTheDocument();
  });

  it("contactable değilse blok ekranı gösterir", () => {
    render(
      <ContactActions
        listingId="l1"
        sellerId="seller-1"
        currentUserId="viewer-1"
        seller={{ blocked: true } as never}
      />
    );

    expect(screen.getByText(/İletişim Kısıtlı/i)).toBeInTheDocument();
  });
});
