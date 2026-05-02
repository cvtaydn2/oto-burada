"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface CsrfContextType {
  token: string | null;
  refresh: () => Promise<string | null>;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

export function CsrfProvider({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string;
}) {
  const [token, setToken] = useState<string | null>(initialToken || null);

  const refresh = async () => {
    try {
      // We can expose an endpoint to get a fresh token if needed,
      // or rely on the one passed from the server.
      // For now, we'll just allow setting it.
      const response = await fetch("/api/auth/csrf");
      const payload = await response.json();
      const token = payload.data?.token;
      if (token) {
        setToken(token);
        return token;
      }
    } catch (error) {
      console.error("Failed to refresh CSRF token", error);
    }
    return null;
  };

  // Sync with initial token if it changes (e.g. on navigation if layout re-renders)
  useEffect(() => {
    if (initialToken) {
      setTimeout(() => setToken(initialToken), 0);
    }
  }, [initialToken]);

  return <CsrfContext.Provider value={{ token, refresh }}>{children}</CsrfContext.Provider>;
}

export function useCsrfToken() {
  const context = useContext(CsrfContext);
  if (context === undefined) {
    throw new Error("useCsrfToken must be used within a CsrfProvider");
  }
  return context;
}
