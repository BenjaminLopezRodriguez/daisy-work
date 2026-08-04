"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Home,
  Inbox,
  Menu,
  Plus,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/work", label: "Work", icon: Briefcase },
  { href: "/create", label: "Post", icon: Plus, center: true },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

const ACCOUNT_LINKS = [
  { href: "/account", label: "Account home" },
  { href: "/profile", label: "Profile" },
  { href: "/payments", label: "Payments" },
  { href: "/organization", label: "Organization" },
  { href: "/saved", label: "Saved" },
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

export function MobileHeader({
  title,
  userName,
}: {
  title?: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[var(--app-z-chrome)] flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[min(20rem,88vw)] flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle className="text-left">
              Daisy<span className="text-primary">.work</span>
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{userName}</p>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto p-2" aria-label="Primary">
            <ul className="space-y-0.5">
              {TABS.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                        {item.label === "Post" ? "Post work" : item.label}
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
            <Separator className="my-3" />
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
              Account
            </p>
            <ul className="space-y-0.5">
              {ACCOUNT_LINKS.map((item) => (
                <li key={item.href}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      className="flex min-h-12 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
      <p className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
        {title ?? (
          <>
            Daisy<span className="text-primary">.work</span>
          </>
        )}
      </p>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[var(--app-z-mobile-nav)] border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{
        height: "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="grid h-[var(--mobile-nav-height)] grid-cols-5 items-end px-1 pt-1">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          if ("center" in tab && tab.center) {
            return (
              <li key={tab.href} className="flex justify-center pb-2">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  aria-label="Post work"
                  className="flex size-12 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[transform,box-shadow,background-color] duration-150 ease-out hover:bg-primary/90 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-5" strokeWidth={2} />
                </Link>
              </li>
            );
          }
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={2} aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
