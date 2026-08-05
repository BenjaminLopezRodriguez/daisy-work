"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isNavActive, navForRole, parentForPath } from "@/lib/daisy/nav";
import { MODE_LABEL } from "@/lib/daisy/role";
import { cn } from "@/lib/utils";

import { AccountMenuBody } from "./role-switch";

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

  return (
    <header className="sticky top-0 z-[var(--app-z-chrome)] flex h-14 items-center gap-1 border-b border-nav-hairline bg-nav-surface-scroll px-3 backdrop-blur md:hidden">
      {parent ? (
        <Link
          href={parent.href}
          aria-label={`Back to ${parent.label}`}
          className="text-nav-ink -ml-1 flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-nav-focus focus-visible:outline-none"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
      ) : null}

      <p className="text-nav-ink min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
        {title ?? (
          <>
            Daisy<span className="text-nav-active">.work</span>
          </>
        )}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Account menu, ${onboardingChoice ? MODE_LABEL[onboardingChoice] : "no mode chosen"}`}
            className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-nav-focus"
          >
            <Avatar className="size-8">
              {userAvatar ? <AvatarImage src={userAvatar} alt="" /> : null}
              <AvatarFallback className="text-xs">
                {initialsOf(userName)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <AccountMenuBody
            userName={userName}
            onboardingChoice={onboardingChoice}
          />
        </DropdownMenuContent>
      </DropdownMenu>
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
      className="fixed inset-x-0 bottom-0 z-[var(--app-z-mobile-nav)] border-t border-nav-hairline bg-nav-surface-scroll backdrop-blur md:hidden"
      style={{
        height:
          "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul
        className="grid h-[var(--mobile-nav-height)]"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
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
                  className="flex h-full min-h-12 flex-col items-center justify-center gap-0.5 text-[length:var(--text-tab-label,0.625rem)] font-medium text-nav-ink-muted focus-visible:ring-2 focus-visible:ring-nav-focus focus-visible:ring-inset focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full bg-nav-active text-primary-foreground",
                      "transition-transform duration-100 active:scale-95",
                      active && "ring-2 ring-nav-active ring-offset-2",
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
                  "focus-visible:ring-2 focus-visible:ring-nav-focus focus-visible:ring-inset focus-visible:outline-none",
                  active ? "text-nav-active" : "text-nav-ink-muted",
                )}
              >
                {/* Colour never carries the active state alone. (§6.6) */}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-nav-active"
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
