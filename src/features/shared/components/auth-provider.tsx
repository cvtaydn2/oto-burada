"use client";

import type { AuthChangeEvent, Session, User, UserResponse } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createSupabaseBrowserClient } from "@/features/shared/lib/browser";

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
  const [isReady, setIsReady] = useState(Boolean(initialUser));
  const router = useRouter();
  const userIdRef = useRef<string | null>(initialUser?.id ?? null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    // ── PILL: Issue 6 - Multi-Tab Sync ──
    const authChannel = new BroadcastChannel("auth_sync");
    authChannel.onmessage = (event) => {
      if (event.data === "SIGNOUT") {
        router.refresh();
      }
    };

    void supabase.auth
      .getUser()
      .then(({ data, error }: UserResponse) => {
        if (!mounted) return;
        if (error && error.name !== "AuthSessionMissingError") {
          console.error("[AuthProvider] getUser error:", error);
        }

        const browserUser = data.user ?? null;

        userIdRef.current = browserUser?.id ?? null;
        setUser(browserUser);
        setIsReady(true);
      })
      .catch((err) => {
        console.error("[AuthProvider] getUser unhandled catch:", err);
        if (mounted) setIsReady(true); // Don't hang the UI even on error
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      const newUser = session?.user ?? null;
      const previousUserId = userIdRef.current;

      userIdRef.current = newUser?.id ?? null;

      if (previousUserId !== newUser?.id) {
        if (event === "SIGNED_OUT") {
          // UX FIX: Handle storage quota errors gracefully
          try {
            authChannel.postMessage("SIGNOUT");
          } catch {
            // BroadcastChannel failed (quota exceeded or blocked), continue silently
          }
        }
        router.refresh();
      }

      setUser(newUser);
      setIsReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      authChannel.close();
    };
  }, [router]); // Removed initialUser to break the refresh loop

  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin: getIsAdmin(user),
      isAuthenticated: Boolean(user),
      isReady,
      user,
      userId: user?.id ?? null,
    }),
    [isReady, user]
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
