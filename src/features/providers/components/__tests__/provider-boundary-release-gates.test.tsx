import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("provider boundary release gates", () => {
  const rootProvidersSource = read("src/features/providers/components/root-providers.tsx");
  const marketplaceProvidersSource = read(
    "src/features/providers/components/marketplace-providers.tsx"
  );

  it("RootProviders yalnız global ownership providerlarını ve query defaults sözleşmesini taşır", () => {
    expect(rootProvidersSource).toContain("staleTime: 10 * 60 * 1000");
    expect(rootProvidersSource).toContain("gcTime: 15 * 60 * 1000");
    expect(rootProvidersSource).toContain("refetchOnWindowFocus: false");
    expect(rootProvidersSource).toContain("retry: 1");

    const themeIndex = rootProvidersSource.indexOf("<ThemeProvider");
    const queryIndex = rootProvidersSource.indexOf("<QueryClientProvider");
    const supabaseIndex = rootProvidersSource.indexOf("<SupabaseProvider>");
    const authIndex = rootProvidersSource.indexOf("<AuthProvider initialUser={user}>");
    const pwaIndex = rootProvidersSource.indexOf("<PWAProvider>");
    const toasterIndex = rootProvidersSource.indexOf("<Toaster />");

    expect(themeIndex).toBeGreaterThan(-1);
    expect(queryIndex).toBeGreaterThan(themeIndex);
    expect(supabaseIndex).toBeGreaterThan(queryIndex);
    expect(authIndex).toBeGreaterThan(supabaseIndex);
    expect(pwaIndex).toBeGreaterThan(authIndex);
    expect(toasterIndex).toBeGreaterThan(pwaIndex);

    expect(rootProvidersSource).not.toContain("FavoritesProvider");
    expect(rootProvidersSource).not.toContain("CsrfProvider");
  });

  it("MarketplaceProviders marketplace-local ownership olarak CSRF ve favorites boundary'sini korur", () => {
    expect(marketplaceProvidersSource).toContain(
      'import { FavoritesProvider } from "@/components/shared/favorites-provider";'
    );
    expect(marketplaceProvidersSource).toContain(
      'import { CsrfProvider } from "@/features/providers/components/csrf-provider";'
    );

    const csrfIndex = marketplaceProvidersSource.indexOf("<CsrfProvider initialToken={csrfToken}>");
    const favoritesIndex = marketplaceProvidersSource.indexOf(
      "<FavoritesProvider>{children}</FavoritesProvider>"
    );

    expect(csrfIndex).toBeGreaterThan(-1);
    expect(favoritesIndex).toBeGreaterThan(csrfIndex);
    expect(marketplaceProvidersSource).not.toContain("AuthProvider");
    expect(marketplaceProvidersSource).not.toContain("SupabaseProvider");
    expect(marketplaceProvidersSource).not.toContain("QueryClientProvider");
  });
});
