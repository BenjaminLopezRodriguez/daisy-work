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
    title: "Your services",
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

/**
 * `label` and `href` are overridable per role. The same destination means a
 * different thing depending on which side of the marketplace you are on, and
 * the nav has to say which — a provider tapping "Browse" wants open jobs, not
 * a catalogue of other providers' services.
 */
function navItem(
  route: RouteDef,
  overrides: { emphasize?: boolean; label?: string; href?: string } = {},
): NavItem {
  return {
    href: overrides.href ?? route.href,
    label: overrides.label ?? route.label,
    icon: route.icon,
    ...(overrides.emphasize ? { emphasize: true } : {}),
  };
}

/**
 * Five slots (§3.2): Home · Browse · Act · Requests · Account, in the order the
 * mobile bar renders them so the emphasized Act slot lands in the centre.
 */
const CUSTOMER_NAV: NavItem[] = [
  navItem(ROUTES.home),
  navItem(ROUTES.browse),
  navItem(ROUTES.create, { emphasize: true }),
  navItem(ROUTES.work),
  navItem(ROUTES.account),
];

/**
 * Same five slots and the same routes as hire mode — only the words and the
 * default scope change. Browse lands on open jobs because that is what a
 * provider came to browse for; Requests becomes "My work" because for this
 * side it means jobs assigned to you and applications you have sent.
 */
const WORKER_NAV: NavItem[] = [
  navItem(ROUTES.home),
  navItem(ROUTES.browse, {
    label: "Find work",
    href: "/marketplace?scope=jobs",
  }),
  navItem(ROUTES.listings, { emphasize: true, label: "Offer" }),
  navItem(ROUTES.work, { label: "My work" }),
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
  // Nav hrefs may carry a default query (`/marketplace?scope=jobs`); the
  // pathname never does. Compare paths, or the provider's Browse tab renders
  // inactive on the page it just navigated to.
  const path = href.split("?")[0];
  return matchRoute(pathname)?.route.href === path;
}

/** Role-aware so the mobile header agrees with the tab bar. */
export function titleForPath(
  pathname: string,
  choice?: OnboardingChoice | null,
): string {
  const match = matchRoute(pathname);
  if (!match) return "Daisy.work";
  if (isWorker(choice) && match.route.href === ROUTES.work.href) {
    return match.title === ROUTES.work.title ? "My work" : match.title;
  }
  return match.title;
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
