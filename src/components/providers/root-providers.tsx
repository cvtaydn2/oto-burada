"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { AuthProvider } from "@/components/shared/auth-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export function RootProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000,
            gcTime: 15 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
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
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
