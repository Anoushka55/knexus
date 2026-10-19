"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { getUser, listPersonas, setUserById, subscribe } from "./store";
import type { SessionUser } from "./types";

/**
 * Who's "signed in" to this console. The original prototype authenticated a
 * persona via a JWT cookie (lib/auth.ts) before anything else rendered; here
 * the knexus shell already handles real authentication, so this is simply a
 * role switcher over the same seeded demo personas (see lib/anti-piracy/seed.ts),
 * read from the external workspace store (lib/anti-piracy/store.ts) so it stays
 * in sync with every `api()`/`post()` call made from anywhere in the console.
 */
interface SessionValue {
  user: SessionUser;
  personas: SessionUser[];
  setPersona: (id: string) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getUser, getUser);
  const personas = listPersonas();
  const setPersona = useCallback((id: string) => setUserById(id), []);

  return <SessionContext.Provider value={{ user, personas, setPersona }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
