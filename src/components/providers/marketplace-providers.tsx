"use client";

import { type PropsWithChildren } from "react";
import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { CompareProvider } from "@/components/shared/compare-provider";

export function MarketplaceProviders({ children }: PropsWithChildren) {
  return (
    <FavoritesProvider>
      <CompareProvider>
        {children}
      </CompareProvider>
    </FavoritesProvider>
  );
}
