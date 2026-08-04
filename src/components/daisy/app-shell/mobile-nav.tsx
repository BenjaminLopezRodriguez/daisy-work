"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Menu, Plus, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/work", label: "Work", icon: Briefcase },
  { href: "/create", label: "Post", icon: Plus },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
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
        <SheetContent
          side="left"
          className="flex w-[min(20rem,88vw)] flex-col gap-0 p-0"
        >
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
                        {item.label}
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
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
        height:
          "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="grid h-[var(--mobile-nav-height)] grid-cols-4">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
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
                <Icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
