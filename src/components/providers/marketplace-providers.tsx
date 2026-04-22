"use client";

import { type PropsWithChildren } from "react";

import { CompareProvider } from "@/components/shared/compare-provider";
import { FavoritesProvider } from "@/components/shared/favorites-provider";

export function MarketplaceProviders({ children }: PropsWithChildren) {
  return (
    <FavoritesProvider>
      <CompareProvider>{children}</CompareProvider>
    </FavoritesProvider>
  );
}
