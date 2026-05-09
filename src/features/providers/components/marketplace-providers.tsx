"use client";

import { type PropsWithChildren } from "react";

import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { CsrfProvider } from "@/features/providers/components/csrf-provider";

interface MarketplaceProvidersProps extends PropsWithChildren {
  csrfToken?: string;
}

export function MarketplaceProviders({ children, csrfToken }: MarketplaceProvidersProps) {
  return (
    <CsrfProvider initialToken={csrfToken}>
      <FavoritesProvider>{children}</FavoritesProvider>
    </CsrfProvider>
  );
}
