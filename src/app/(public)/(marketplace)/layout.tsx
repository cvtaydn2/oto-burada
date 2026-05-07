import { type PropsWithChildren } from "react";

import { MarketplaceProviders } from "@/features/providers/components/marketplace-providers";

export default function MarketplaceLayout({ children }: PropsWithChildren) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
