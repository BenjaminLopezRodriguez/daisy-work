"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { titleForPath } from "@/lib/daisy/nav";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav, MobileHeader } from "./mobile-nav";

export function DaisyAppShell({
  userName,
  userAvatar,
  onboardingChoice,
  children,
}: {
  userName: string;
  userAvatar?: string | null;
  onboardingChoice: "hire" | "provide" | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = titleForPath(pathname, onboardingChoice);

  return (
    <TooltipProvider delayDuration={0}>
      {/* First focusable element on every page. (§6.4) */}
      <a
        href="#main-content"
        className="focus:bg-nav-surface focus:text-nav-ink focus:shadow-nav-float focus:ring-nav-focus sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:outline-none"
      >
        Skip to content
      </a>
      <SidebarProvider defaultOpen className="app-shell">
        <DesktopSidebar
          userName={userName}
          userAvatar={userAvatar}
          onboardingChoice={onboardingChoice}
        />
        <SidebarInset className="bg-background min-h-dvh">
          <MobileHeader
            title={title}
            userName={userName}
            userAvatar={userAvatar}
            onboardingChoice={onboardingChoice}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="app-content app-content-pad flex-1 px-4 pt-6 focus:outline-none sm:px-6 md:pt-10 lg:px-8"
          >
            {children}
          </main>
        </SidebarInset>
        <MobileBottomNav onboardingChoice={onboardingChoice} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
