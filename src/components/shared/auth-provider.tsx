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
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    if (!initialUser) {
      void supabase.auth.getUser().then(({ data }: UserResponse) => {
        if (!mounted) return;
        setUser(data.user ?? null);
        setIsReady(true);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      const newUser = session?.user ?? null;
      
      // ── PILL: Issue 10 - SSR/CSR Auth Gap Closure ──
      // Force refresh the server components if the auth state changes 
      // (e.g. login/logout in another tab).
      if (user?.id !== newUser?.id) {
        router.refresh();
      }

      setUser(newUser);
      setIsReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialUser, user?.id, router]);

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
