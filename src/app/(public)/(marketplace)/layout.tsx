import { headers } from "next/headers";
import { type PropsWithChildren } from "react";

import { MarketplaceProviders } from "@/features/providers/components/marketplace-providers";

export default async function MarketplaceLayout({ children }: PropsWithChildren) {
  const headersList = await headers();
  const csrfToken = headersList.get("x-csrf-token") ?? undefined;

  return <MarketplaceProviders csrfToken={csrfToken}>{children}</MarketplaceProviders>;
}
