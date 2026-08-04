"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { User } from "@/domain";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";

export type AppSession = {
  currentUser: User;
};

const AppSessionContext = createContext<AppSession | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = api.me.get.useQuery();

  const value = useMemo<AppSession | null>(() => {
    if (!user) return null;
    return { currentUser: user };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  if (isError || !value) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-sm text-muted-foreground">
        Couldn’t load your account. Check the database connection.
      </div>
    );
  }

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
