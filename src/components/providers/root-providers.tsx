"use client";

import { type User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { PostHogProvider } from "@/components/providers/posthog-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { AuthProvider } from "@/components/shared/auth-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

interface RootProvidersProps extends PropsWithChildren {
  user: User | null;
  nonce?: string;
}

export function RootProviders({ children, user, nonce }: RootProvidersProps) {
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
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      nonce={nonce}
    >
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <AuthProvider initialUser={user}>
            <PWAProvider>
            <PostHogProvider>{children}</PostHogProvider>
          </PWAProvider>
          </AuthProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
