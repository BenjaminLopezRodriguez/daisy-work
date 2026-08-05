"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isNavActive, navForRole } from "@/lib/daisy/nav";
import { MODE_LABEL } from "@/lib/daisy/role";

import { AccountMenuBody } from "./role-switch";

export function DesktopSidebar({
  userName,
  userAvatar,
  onboardingChoice,
}: {
  userName: string;
  userAvatar?: string | null;
  onboardingChoice: "hire" | "provide" | null;
}) {
  const pathname = usePathname();
  const mainNav = navForRole(onboardingChoice);
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={
                        item.emphasize && !active
                          ? "bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/15 hover:text-sidebar-primary"
                          : undefined
                      }
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-11 md:justify-start md:px-2 group-data-[collapsible=icon]:md:justify-center group-data-[collapsible=icon]:md:px-0"
            >
              <Avatar className="size-8 shrink-0">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt="" />
                ) : null}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate">{userName}</span>
                {/* The mode must be legible without opening a menu. (§5.6) */}
                <span className="text-nav-ink-muted block truncate text-xs">
                  {onboardingChoice ? MODE_LABEL[onboardingChoice] : "Choose a mode"}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <AccountMenuBody
              userName={userName}
              onboardingChoice={onboardingChoice}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
