"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  Plus,
  Inbox,
  UserRound,
} from "lucide-react";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAIN_NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/work", label: "Work", icon: Briefcase },
  { href: "/create", label: "Post", icon: Plus, emphasize: true },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  if (href === "/account") {
    return (
      pathname === "/account" ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/payments") ||
      pathname.startsWith("/saved") ||
      pathname.startsWith("/organization")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar({
  userName,
  userId,
}: {
  userName: string;
  userId: string;
}) {
  const pathname = usePathname();
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
              {MAIN_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={
                        "emphasize" in item && item.emphasize && !active
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
              className="flex size-11 w-full items-center justify-center gap-2 rounded-md text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-11 md:justify-start md:px-2 group-data-[collapsible=icon]:md:justify-center group-data-[collapsible=icon]:md:px-0"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate group-data-[collapsible=icon]:hidden">
                {userName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate">{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">Account</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/profile/${userId}`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/payments">Payments</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/organization">Organization</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/saved">Saved</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Sign out (demo)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
