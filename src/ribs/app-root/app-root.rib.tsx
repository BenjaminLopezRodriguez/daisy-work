"use client";

import { createRib, useRibLifecycle } from "nextjs-ribs";

import { DaisyAppShell } from "@/components/daisy/app-shell/daisy-app-shell";
import { useAppSession } from "@/lib/daisy/session";
import type { User } from "@/domain";

export type AppRootDeps = {
  currentUser: User;
};

export const AppRootRib = createRib({
  name: "AppRoot",
  interactor: (deps: AppRootDeps) => {
    useRibLifecycle({});
    return {
      currentUser: deps.currentUser,
    };
  },
  presenter: (state) => ({
    userName: state.currentUser.name,
  }),
});

export function AppRootView({ children }: { children: React.ReactNode }) {
  const vm = AppRootRib.useViewModel();
  return (
    <DaisyAppShell userName={vm.userName}>
      {children}
    </DaisyAppShell>
  );
}

export function AppRootProvider({ children }: { children: React.ReactNode }) {
  const session = useAppSession();
  return (
    <AppRootRib.Provider deps={{ currentUser: session.currentUser }}>
      <AppRootView>{children}</AppRootView>
    </AppRootRib.Provider>
  );
}
