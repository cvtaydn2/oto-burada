"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { captureClientException } from "@/lib/monitoring/telemetry-client";

interface CsrfContextType {
  token: string | null;
  isReady: boolean;
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
  const hasInitialToken = Boolean(initialToken);
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [isReady, setIsReady] = useState<boolean>(hasInitialToken);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const pendingPromise = (async () => {
      try {
        const response = await fetch("/api/auth/csrf", {
          credentials: "same-origin",
        });

        if (!response.ok) {
          setToken(null);
          return null;
        }

        const payload = await response.json();
        const nextToken = payload.data?.token;

        if (nextToken) {
          setToken(nextToken);
          return nextToken;
        }

        setToken(null);
        return null;
      } catch (error) {
        captureClientException(error, "csrf-provider-refresh");
        setToken(null);
        return null;
      } finally {
        setIsReady(true);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = pendingPromise;
    return pendingPromise;
  }, []);

  const value = useMemo(
    () => ({
      token,
      isReady,
      refresh,
    }),
    [token, isReady, refresh]
  );

  return <CsrfContext.Provider value={value}>{children}</CsrfContext.Provider>;
}

export function useCsrfToken() {
  const context = useContext(CsrfContext);
  if (context === undefined) {
    throw new Error("useCsrfToken must be used within a CsrfProvider");
  }
  return context;
}
