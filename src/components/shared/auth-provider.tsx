"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthChangeEvent, Session, User, UserResponse } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface AuthContextValue {
  isAdmin: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  user: User | null;
  userId: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getIsAdmin(user: User | null) {
  const role = (user?.app_metadata as { role?: string } | undefined)?.role;
  return role === "admin";
}

interface AuthProviderProps extends PropsWithChildren {
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isReady, setIsReady] = useState(!!initialUser);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    // Sadece initialUser yoksa veya sessiz doğrulama gerekiyorsa çalıştır
    if (!initialUser) {
      void supabase.auth.getUser().then(({ data }: UserResponse) => {
        if (!mounted) return;
        setUser(data.user ?? null);
        setIsReady(true);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) {
        return;
      }

      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin: getIsAdmin(user),
      isAuthenticated: Boolean(user),
      isReady,
      user,
      userId: user?.id ?? null,
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthUser must be used within AuthProvider");
  }

  return context;
}
