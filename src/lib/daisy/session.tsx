"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CURRENT_USER_ID, seedUsers } from "@/server/mocks/seed";
import { createMockServices, type DaisyServices } from "@/server/services";
import type { User } from "@/domain";

export type AppSession = {
  currentUser: User;
  services: DaisyServices;
};

const AppSessionContext = createContext<AppSession | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppSession>(() => {
    const currentUser =
      seedUsers.find((u) => u.id === CURRENT_USER_ID) ?? seedUsers[0]!;
    return {
      currentUser,
      services: createMockServices(),
    };
  }, []);

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession(): AppSession {
  const ctx = useContext(AppSessionContext);
  if (!ctx) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return ctx;
}
