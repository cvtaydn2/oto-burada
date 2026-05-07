"use client";

import { type User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { CsrfProvider } from "@/features/providers/components/csrf-provider";
import { PWAProvider } from "@/features/providers/components/pwa-provider";
import { SupabaseProvider } from "@/features/providers/components/supabase-provider";
import { AuthProvider } from "@/features/shared/components/auth-provider";
import { FavoritesProvider } from "@/features/shared/components/favorites-provider";
import { ThemeProvider } from "@/features/shared/components/theme-provider";
import { Toaster } from "@/features/ui/components/sonner";

interface RootProvidersProps extends PropsWithChildren {
  user: User | null;
  nonce?: string;
  csrfToken?: string;
}

export function RootProviders({ children, user, nonce, csrfToken }: RootProvidersProps) {
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
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
      nonce={nonce}
    >
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <CsrfProvider initialToken={csrfToken}>
            <AuthProvider initialUser={user}>
              <FavoritesProvider>
                <PWAProvider>
                  {children}
                  <Toaster />
                </PWAProvider>
              </FavoritesProvider>
            </AuthProvider>
          </CsrfProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
