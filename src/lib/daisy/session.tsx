"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import Link from "next/link";

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

  if (isError) {
    return (
      <div className="text-muted-foreground flex min-h-dvh items-center justify-center p-6 text-sm">
        Couldn’t load your account. Try again in a moment.
      </div>
    );
  }

  // ponytail: signed-out is a normal state here, not an error — send them to sign in.
  if (!value) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Sign in to see your jobs.
        </p>
        <Link
          href="/signin"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
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
