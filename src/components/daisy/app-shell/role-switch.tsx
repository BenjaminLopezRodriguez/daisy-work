"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import {
  MODE_LABEL,
  roleHomePath,
  type OnboardingChoice,
} from "@/lib/daisy/role";
import { cn } from "@/lib/utils";

const MODES: OnboardingChoice[] = ["hire", "provide"];

/**
 * Persists `onboardingChoice`, then lands on the new mode's slot-1 destination
 * so the nav reshape is explained by an obvious navigation. (§5.6)
 */
function useRoleSwitch(current: OnboardingChoice | null) {
  const router = useRouter();
  const utils = api.useUtils();
  const [pendingChoice, setPendingChoice] = useState<OnboardingChoice | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");

  const mutation = api.provider.setIntent.useMutation({
    onSuccess: async ({ choice }) => {
      setAnnouncement(
        `Now viewing as ${choice === "provide" ? "a provider" : "a customer"}`,
      );
      await utils.invalidate();
      router.push(roleHomePath(choice));
      router.refresh();
    },
    onSettled: () => setPendingChoice(null),
  });

  function switchTo(choice: string) {
    if (choice === current || mutation.isPending) return;
    setPendingChoice(choice as OnboardingChoice);
    mutation.mutate({ choice: choice as OnboardingChoice });
  }

  return { switchTo, pendingChoice, announcement, error: mutation.error };
}

function LiveRegion({ message }: { message: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {message}
    </span>
  );
}

/**
 * Account menu body, shared by the desktop sidebar footer and the mobile
 * header — so Advertise and Sign out are reachable on both. (§5.1, §5.6)
 */
export function AccountMenuBody({
  userName,
  onboardingChoice,
}: {
  userName: string;
  onboardingChoice: OnboardingChoice | null;
}) {
  const { switchTo, pendingChoice, announcement, error } =
    useRoleSwitch(onboardingChoice);

  return (
    <>
      <DropdownMenuLabel className="truncate">{userName}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-nav-ink-muted text-[0.6875rem] font-medium tracking-wide uppercase">
        Viewing as
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label="Viewing as"
        aria-busy={pendingChoice !== null}
        value={onboardingChoice ?? ""}
        onValueChange={switchTo}
      >
        {MODES.map((mode) => (
          <DropdownMenuRadioItem
            key={mode}
            value={mode}
            // Keep the menu open while the mutation is in flight — it is the
            // only feedback surface the user has.
            onSelect={(event) => event.preventDefault()}
            className={cn(
              "min-h-11",
              onboardingChoice === mode && "text-nav-active",
            )}
          >
            {MODE_LABEL[mode]}
            {pendingChoice === mode ? (
              <Loader2 className="ml-auto size-3.5 animate-spin" aria-hidden />
            ) : null}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      {error ? (
        <p role="alert" className="text-destructive px-2 py-1 text-xs">
          Couldn’t switch mode. Try again.
        </p>
      ) : null}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="min-h-11">
        <Link href="/account">Account</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="min-h-11">
        <Link href="/account/ads">Advertise</Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="min-h-11"
        onSelect={() => void signOut({ redirectTo: "/signin" })}
      >
        Sign out
      </DropdownMenuItem>
      <LiveRegion message={announcement} />
    </>
  );
}

/**
 * Mobile account menu. A bottom drawer, not a dropdown — thumb reach, and it
 * gives the role rows room to be real 56px targets. (§5.6)
 */
export function AccountDrawerBody({
  onboardingChoice,
  onNavigate,
}: {
  onboardingChoice: OnboardingChoice | null;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      <div>
        <p className="text-nav-ink-muted mb-2 text-[0.6875rem] font-medium tracking-wide uppercase">
          Viewing as
        </p>
        <RoleSwitchRows onboardingChoice={onboardingChoice} />
      </div>
      <div className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
        <Link
          href="/account"
          onClick={onNavigate}
          className="focus-visible:ring-nav-focus flex min-h-14 items-center px-4 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          Account
        </Link>
        <Link
          href="/account/ads"
          onClick={onNavigate}
          className="focus-visible:ring-nav-focus flex min-h-14 items-center px-4 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          Advertise
        </Link>
        <button
          type="button"
          onClick={() => void signOut({ redirectTo: "/signin" })}
          className="focus-visible:ring-nav-focus flex min-h-14 w-full items-center px-4 text-left text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/**
 * Mobile anatomy (§5.6): the same radio group as two full-width rows on
 * `/account`, not hidden behind a menu on the settings surface itself.
 */
export function RoleSwitchRows({
  onboardingChoice,
}: {
  onboardingChoice: OnboardingChoice | null;
}) {
  const { switchTo, pendingChoice, announcement, error } =
    useRoleSwitch(onboardingChoice);

  return (
    <div
      role="radiogroup"
      aria-label="Viewing as"
      aria-busy={pendingChoice !== null}
      className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border"
    >
      {MODES.map((mode) => {
        const checked = onboardingChoice === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => switchTo(mode)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-medium",
              "focus-visible:ring-nav-focus focus-visible:ring-2 focus-visible:outline-none",
              checked ? "text-nav-active" : "hover:bg-muted/50",
            )}
          >
            <span className="flex-1">{MODE_LABEL[mode]}</span>
            {pendingChoice === mode ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : checked ? (
              <Check className="size-4" aria-hidden />
            ) : null}
          </button>
        );
      })}
      {error ? (
        <p role="alert" className="text-destructive px-4 py-2 text-xs">
          Couldn’t switch mode. Try again.
        </p>
      ) : null}
      <LiveRegion message={announcement} />
    </div>
  );
}
