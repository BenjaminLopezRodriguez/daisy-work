import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SIGNED_OUT_NAV } from "@/lib/daisy/nav";

/**
 * Chrome for pages a signed-out visitor can reach. Matches the landing header:
 * same wordmark, same sticky behaviour, same actions, so moving between the
 * landing page and a job or profile doesn't change the furniture.
 */
export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const browse = SIGNED_OUT_NAV.find((item) => item.href === "/marketplace");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold tracking-tight"
        >
          Daisy<span className="text-primary">.work</span>
        </Link>

        {/* Browse folds away on narrow screens; the bottom nav carries it
            there. Nothing here is allowed to force the page wider. */}
        {browse ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href={browse.href}>{browse.label}</Link>
          </Button>
        ) : null}

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="min-w-0">
            <Link href={signedIn ? "/work" : "/signin"} className="truncate">
              {signedIn ? "Your work" : "Sign in"}
            </Link>
          </Button>
          <Button asChild size="sm" className="min-w-0">
            <Link href="/create" className="truncate">
              Post a job
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
