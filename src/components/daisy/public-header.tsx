import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Chrome for pages a signed-out visitor can reach: job details, provider
 * profiles, service listings. Signed-in visitors get a way back into the app
 * instead of a sign-in prompt.
 */
export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Daisy<span className="text-primary">.work</span>
        </Link>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/work">Your work</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/create">Post a job</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
