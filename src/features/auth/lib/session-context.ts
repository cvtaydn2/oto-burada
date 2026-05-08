import type { User } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "async_hooks";

import type { UserRole } from "@/types";

export interface SessionContext {
  user: User | null;
  dbProfile: {
    role: UserRole;
    isBanned: boolean;
  } | null;
}

const sessionStore = new AsyncLocalStorage<SessionContext>();

/**
 * Executes a function within a session context.
 * Useful for ensuring consistent auth state across a single request/action.
 */
export function withSessionContext<T>(context: SessionContext, fn: () => T): T {
  return sessionStore.run(context, fn);
}

/**
 * Retrieves the current session context if available.
 */
export function getSessionContext(): SessionContext | null {
  return sessionStore.getStore() || null;
}
