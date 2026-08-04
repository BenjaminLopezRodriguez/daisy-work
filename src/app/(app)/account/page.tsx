import Link from "next/link";
import {
  Bookmark,
  Building2,
  ChevronRight,
  CircleHelp,
  Settings,
  UserRound,
  Wallet,
} from "lucide-react";

import { AppPage, PageHeader } from "@/components/daisy";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const LINKS = [
  {
    href: "/profile",
    label: "Profile",
    hint: "Skills, credentials, availability",
    icon: UserRound,
  },
  {
    href: "/organization",
    label: "Organization",
    hint: "Members, billing, policies",
    icon: Building2,
  },
  {
    href: "/payments",
    label: "Payments",
    hint: "Balance and transactions",
    icon: Wallet,
  },
  {
    href: "/saved",
    label: "Saved",
    hint: "Work and people you saved",
    icon: Bookmark,
  },
  {
    href: "/home#settings",
    label: "Settings",
    hint: "Preferences for this demo",
    icon: Settings,
  },
  {
    href: "/home#help",
    label: "Help",
    hint: "How Daisy works",
    icon: CircleHelp,
  },
] as const;

export default function AccountPage() {
  return (
    <AppPage width="form">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
        <PageHeader
          title="Account"
          description="Profile, payments, and organization live here — not in the main nav."
        />
      </div>

      <ul className="list-stagger divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="surface-interactive flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
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
