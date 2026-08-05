import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Home,
  Package,
  UserRound,
} from "lucide-react";

import type { OnboardingChoice } from "@/lib/daisy/role";
import { isWorker } from "@/lib/daisy/role";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  emphasize?: boolean;
};

/** Hire: describe/match home, requests, account. */
const CUSTOMER_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, emphasize: true },
  { href: "/work", label: "Requests", icon: Briefcase },
  { href: "/account", label: "Account", icon: UserRound },
];

/** Provide: services, inbound requests, account. */
const WORKER_NAV: NavItem[] = [
  { href: "/services", label: "Services", icon: Package, emphasize: true },
  { href: "/work", label: "Requests", icon: Briefcase },
  { href: "/account", label: "Account", icon: UserRound },
];

const DEFAULT_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/work", label: "Requests", icon: Briefcase },
  { href: "/account", label: "Account", icon: UserRound },
];

export function navForRole(choice: OnboardingChoice | null | undefined): NavItem[] {
  if (isWorker(choice)) return WORKER_NAV;
  if (choice === "hire") return CUSTOMER_NAV;
  return DEFAULT_NAV;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home";
  if (href === "/services") {
    return pathname === "/services" || pathname.startsWith("/services/");
  }
  if (href === "/work") {
    return pathname === "/work" || pathname.startsWith("/work/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
