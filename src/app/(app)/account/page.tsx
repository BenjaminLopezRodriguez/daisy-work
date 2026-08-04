"use client";

import Link from "next/link";
import {
  Building2,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Bookmark,
  Settings,
  UserRound,
} from "lucide-react";

import { AppPage, PageHeader } from "@/components/daisy";

const LINKS = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/organization", label: "Organization", icon: Building2 },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/account", label: "Settings", icon: Settings, soon: true },
  { href: "/account", label: "Help", icon: HelpCircle, soon: true },
] as const;

export default function AccountPage() {
  return (
    <AppPage width="form" className="max-w-xl space-y-6">
      <PageHeader title="Account" description="Manage your Daisy.work profile." />
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {LINKS.filter((l) => !("soon" in l && l.soon)).map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </AppPage>
  );
}
