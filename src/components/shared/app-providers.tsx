"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { CompareProvider } from "@/components/shared/compare-provider";

interface AppProvidersProps extends PropsWithChildren {
  userId?: string | null;
}

export function AppProviders({ children, userId }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider userId={userId}>
        <CompareProvider>{children}</CompareProvider>
      </FavoritesProvider>
    </QueryClientProvider>
  );
}
