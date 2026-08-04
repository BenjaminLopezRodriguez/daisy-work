"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav, MobileHeader } from "./mobile-nav";
import { AskDaisy } from "../ask-daisy";

const TITLES: Record<string, string> = {
  "/home": "Home",
  "/work": "Work",
  "/create": "Post",
  "/inbox": "Inbox",
  "/account": "Account",
  "/payments": "Payments",
  "/saved": "Saved",
  "/organization": "Organization",
  "/profile": "Profile",
};

function pageTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/work/")) return "Work Order";
  if (pathname.startsWith("/profile/")) return "Profile";
  return "Daisy.work";
}

export function DaisyAppShell({
  userName,
  userId,
  children,
}: {
  userName: string;
  userId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = pageTitle(pathname);
  const showAskDaisy = pathname !== "/home" && pathname !== "/create";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="app-shell">
        <DesktopSidebar userName={userName} userId={userId} />
        <SidebarInset className="min-h-dvh bg-background">
          <MobileHeader title={title} userName={userName} />

          <div className="app-content app-content-pad flex-1 px-4 pt-6 sm:px-6 md:pt-10 lg:px-8">
            {children}
          </div>
        </SidebarInset>
        <MobileBottomNav />
        {showAskDaisy ? <AskDaisy /> : null}
      </SidebarProvider>
    </TooltipProvider>
  );
}
