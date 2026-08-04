"use client";

import { createRib, useRibLifecycle } from "nextjs-ribs";

import { DaisyAppShell } from "@/components/daisy/app-shell/daisy-app-shell";
import { useAppSession } from "@/lib/daisy/session";
import type { User } from "@/domain";
import type { DaisyServices } from "@/server/services";

export type AppRootDeps = {
  currentUser: User;
  services: DaisyServices;
};

export const AppRootRib = createRib({
  name: "AppRoot",
  interactor: (deps: AppRootDeps) => {
    useRibLifecycle({});
    return {
      currentUser: deps.currentUser,
      services: deps.services,
    };
  },
  presenter: (state) => ({
    userName: state.currentUser.name,
    userId: state.currentUser.id,
  }),
});

export function AppRootView({ children }: { children: React.ReactNode }) {
  const vm = AppRootRib.useViewModel();
  return (
    <DaisyAppShell userName={vm.userName} userId={vm.userId}>
      {children}
    </DaisyAppShell>
  );
}

export function AppRootProvider({ children }: { children: React.ReactNode }) {
  const session = useAppSession();
  return (
    <AppRootRib.Provider
      deps={{ currentUser: session.currentUser, services: session.services }}
    >
      <AppRootView>{children}</AppRootView>
    </AppRootRib.Provider>
  );
}
