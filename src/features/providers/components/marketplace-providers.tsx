"use client";

import { type PropsWithChildren } from "react";

import { FavoritesProvider } from "@/features/shared/components/favorites-provider";

export function MarketplaceProviders({ children }: PropsWithChildren) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}
