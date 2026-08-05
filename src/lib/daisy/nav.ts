import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Home,
  Package,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

import type { OnboardingChoice } from "@/lib/daisy/role";
import { isWorker } from "@/lib/daisy/role";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The "Act" slot — elevated centre action on mobile, tinted in the sidebar. */
  emphasize?: boolean;
};

type ChildRoute = { prefix: string; title: string };

type RouteDef = NavItem & {
  /** Header title for the route itself. */
  title: string;
  /** Deeper paths this slot owns, with their own header titles. */
  children?: ChildRoute[];
};

/**
 * The one route registry. Nav items, page titles, and active-matching all
 * derive from this — there is no second table to drift against.
 */
const ROUTES = {
  home: { href: "/home", label: "Home", title: "Home", icon: Home },
  browse: {
    href: "/marketplace",
    label: "Browse",
    title: "Browse",
    icon: Search,
    // Public detail routes hang off Browse, not off the private manager. (§3.3)
    children: [
      { prefix: "/services/", title: "Service" },
      { prefix: "/providers/", title: "Provider" },
    ],
  },
  create: {
    href: "/create",
    label: "Post a job",
    title: "What do you need?",
    icon: Plus,
  },
  listings: {
    href: "/services",
    label: "My listings",
    title: "My listings",
    icon: Package,
  },
  work: {
    href: "/work",
    label: "Requests",
    title: "Requests",
    icon: Briefcase,
    children: [{ prefix: "/work/", title: "Request" }],
  },
  account: {
    href: "/account",
    label: "Account",
    title: "Account",
    icon: UserRound,
    children: [
      { prefix: "/account/ads", title: "Advertise" },
      { prefix: "/account/payouts", title: "Payouts" },
    ],
  },
} satisfies Record<string, RouteDef>;

const ROUTE_LIST: RouteDef[] = Object.values(ROUTES);

function navItem(route: RouteDef, emphasize = false): NavItem {
  return {
    href: route.href,
    label: route.label,
    icon: route.icon,
    ...(emphasize ? { emphasize: true } : {}),
  };
}

/**
 * Five slots (§3.2): Home · Browse · Act · Requests · Account, in the order the
 * mobile bar renders them so the emphasized Act slot lands in the centre.
 */
const CUSTOMER_NAV: NavItem[] = [
  navItem(ROUTES.home),
  navItem(ROUTES.browse),
  navItem(ROUTES.create, true),
  navItem(ROUTES.work),
  navItem(ROUTES.account),
];

/**
 * Same five slots as hire mode; `/home` renders a provider-shaped dashboard
 * now that it no longer redirects to `/services`. (§3.2, note on slot 4.)
 */
const WORKER_NAV: NavItem[] = [
  navItem(ROUTES.home),
  navItem(ROUTES.browse),
  navItem(ROUTES.listings, true),
  navItem(ROUTES.work),
  navItem(ROUTES.account),
];

/** Signed in, no choice recorded yet: hire shape, nothing emphasized. */
const DEFAULT_NAV: NavItem[] = [
  navItem(ROUTES.home),
  navItem(ROUTES.browse),
  navItem(ROUTES.create),
  navItem(ROUTES.work),
  navItem(ROUTES.account),
];

/** Signed-out column of §3.2, for the marketing header. */
export const SIGNED_OUT_NAV: NavItem[] = [
  navItem(ROUTES.browse),
  navItem(ROUTES.create),
];

export function navForRole(
  choice: OnboardingChoice | null | undefined,
): NavItem[] {
  if (isWorker(choice)) return WORKER_NAV;
  if (choice === "hire") return CUSTOMER_NAV;
  return DEFAULT_NAV;
}

/** Longest-prefix match against the registry. */
function matchRoute(
  pathname: string,
): { route: RouteDef; title: string } | null {
  const exact = ROUTE_LIST.find((r) => r.href === pathname);
  if (exact) return { route: exact, title: exact.title };

  let best: { route: RouteDef; title: string; len: number } | null = null;
  for (const route of ROUTE_LIST) {
    for (const child of route.children ?? []) {
      if (!pathname.startsWith(child.prefix)) continue;
      if (best && child.prefix.length <= best.len) continue;
      best = { route, title: child.title, len: child.prefix.length };
    }
  }
  return best ? { route: best.route, title: best.title } : null;
}

export function isNavActive(pathname: string, href: string): boolean {
  return matchRoute(pathname)?.route.href === href;
}

export function titleForPath(pathname: string): string {
  return matchRoute(pathname)?.title ?? "Daisy.work";
}

/**
 * Mobile back affordance (§5.7): detail routes collapse their breadcrumb to a
 * single link back to the owning slot. Top-level routes get nothing.
 */
export function parentForPath(
  pathname: string,
): { href: string; label: string } | null {
  const match = matchRoute(pathname);
  if (!match || match.route.href === pathname) return null;
  return { href: match.route.href, label: match.route.label };
}
