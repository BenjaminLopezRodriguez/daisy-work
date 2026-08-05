"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav, MobileHeader } from "./mobile-nav";

const TITLES: Record<string, string> = {
  "/home": "Home",
  "/work": "Requests",
  "/marketplace": "Marketplace",
  "/create": "What do you need?",
  "/services": "Services",
  "/account": "Account",
  "/account/ads": "Advertise",
};

function pageTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/work/")) return "Request";
  if (pathname.startsWith("/services/")) return "Service";
  if (pathname.startsWith("/providers/")) return "Provider";
  return "Daisy.work";
}

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
  const title = pageTitle(pathname);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="app-shell">
        <DesktopSidebar
          userName={userName}
          userAvatar={userAvatar}
          onboardingChoice={onboardingChoice}
        />
        <SidebarInset className="min-h-dvh bg-background">
          <MobileHeader
            title={title}
            userName={userName}
            onboardingChoice={onboardingChoice}
          />
          <div className="app-content app-content-pad flex-1 px-4 pt-6 sm:px-6 md:pt-10 lg:px-8">
            {children}
          </div>
        </SidebarInset>
        <MobileBottomNav onboardingChoice={onboardingChoice} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
