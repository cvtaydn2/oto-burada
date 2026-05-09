"use client";

import { type PropsWithChildren } from "react";

import { FavoritesProvider } from "@/components/shared/favorites-provider";

export function MarketplaceProviders({ children }: PropsWithChildren) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}
