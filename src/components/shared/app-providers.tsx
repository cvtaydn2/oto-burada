"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { AuthProvider } from "@/components/shared/auth-provider";
import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { CompareProvider } from "@/components/shared/compare-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export function AppProviders({ children }: PropsWithChildren) {
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
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <CompareProvider>
              <PostHogProvider>
                {children}
              </PostHogProvider>
            </CompareProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
