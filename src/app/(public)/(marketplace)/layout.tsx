import { type PropsWithChildren } from "react";

import { MarketplaceProviders } from "@/components/providers/marketplace-providers";

export default function MarketplaceLayout({ children }: PropsWithChildren) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
