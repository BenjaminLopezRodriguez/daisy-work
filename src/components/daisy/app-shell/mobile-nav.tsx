"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { isNavActive, navForRole, parentForPath } from "@/lib/daisy/nav";
import { MODE_LABEL } from "@/lib/daisy/role";
import { cn } from "@/lib/utils";

import { Logo } from "@/components/daisy/logo";

import { NotificationBell } from "./notification-bell";
import { AccountDrawerBody } from "./role-switch";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

/**
 * The hamburger sheet is gone — it duplicated the bottom tab bar verbatim.
 * The freed left slot now carries a back affordance on detail routes (§5.1),
 * and the right slot carries the account menu so Advertise, the role switch,
 * and Sign out are reachable on mobile (§5.6).
 */
export function MobileHeader({
  title,
  userName,
  userAvatar,
  onboardingChoice,
}: {
  title?: string;
  userName: string;
  userAvatar?: string | null;
  onboardingChoice: "hire" | "provide" | null;
}) {
  const pathname = usePathname();
  const parent = parentForPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-nav-hairline bg-nav-surface-scroll sticky top-0 z-[var(--app-z-chrome)] flex h-14 items-center gap-1 border-b px-3 backdrop-blur md:hidden">
      {parent ? (
        <Link
          href={parent.href}
          aria-label={`Back to ${parent.label}`}
          className="text-nav-ink focus-visible:ring-nav-focus -ml-1 flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
      ) : null}

      <p className="text-nav-ink min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
        {title ?? (
          <Logo className="text-base" accentClassName="text-nav-active" />
        )}
      </p>

      <NotificationBell className="-mr-1" />

      {/* Bottom drawer, not a dropdown: menus anchored to the top-right corner
          are the furthest point from the thumb. */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            aria-label={`Account menu, ${onboardingChoice ? MODE_LABEL[onboardingChoice] : "no mode chosen"}`}
            className="focus-visible:ring-nav-focus -mr-1 flex size-11 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2"
          >
            <Avatar className="size-8">
              {userAvatar ? <AvatarImage src={userAvatar} alt="" /> : null}
              <AvatarFallback className="text-xs">
                {initialsOf(userName)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="truncate">{userName}</DrawerTitle>
            <DrawerDescription>
              {onboardingChoice
                ? MODE_LABEL[onboardingChoice]
                : "Choose a mode"}
            </DrawerDescription>
          </DrawerHeader>
          <AccountDrawerBody
            onboardingChoice={onboardingChoice}
            onNavigate={() => setMenuOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </header>
  );
}

export function MobileBottomNav({
  onboardingChoice,
}: {
  onboardingChoice: "hire" | "provide" | null;
}) {
  const pathname = usePathname();
  const tabs = navForRole(onboardingChoice);

  return (
    <nav
      aria-label="Primary"
      className="border-nav-hairline bg-nav-surface-scroll fixed inset-x-0 bottom-0 z-[var(--app-z-mobile-nav)] border-t backdrop-blur md:hidden"
      style={{
        height:
          "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul
        className="grid h-[var(--mobile-nav-height)]"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => {
          const active = isNavActive(pathname, tab.href);
          const Icon = tab.icon;

          // The Act slot is the elevated centre action. (§5.5)
          if (tab.emphasize) {
            return (
              /* Emphasised, but in normal flow: an element hanging outside the
                 bar clips against the viewport on short screens. */
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="text-nav-ink-muted focus-visible:ring-nav-focus flex h-full min-h-12 flex-col items-center justify-center gap-0.5 text-[length:var(--text-tab-label,0.625rem)] font-medium focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                >
                  <span
                    className={cn(
                      "bg-nav-active text-primary-foreground flex size-7 items-center justify-center rounded-full",
                      "transition-transform duration-100 active:scale-95",
                      active && "ring-nav-active ring-2 ring-offset-2",
                    )}
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  {tab.label}
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
                  "relative flex h-full min-h-12 flex-col items-center justify-center gap-0.5 text-[length:var(--text-tab-label,0.625rem)] font-medium transition-colors duration-150",
                  "focus-visible:ring-nav-focus focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                  active ? "text-nav-active" : "text-nav-ink-muted",
                )}
              >
                {/* Colour never carries the active state alone. (§6.6) */}
                {active ? (
                  <span
                    aria-hidden
                    className="bg-nav-active absolute inset-x-3 top-0 h-0.5 rounded-b-full"
                  />
                ) : null}
                <Icon
                  className="size-5"
                  aria-hidden
                  strokeWidth={active ? 2.5 : 2}
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
