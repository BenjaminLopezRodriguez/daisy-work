"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";

/**
 * Payout setup. Everything sensitive — bank details, tax forms, ID — is
 * collected by Stripe on their own pages; this screen only ever knows whether
 * they said yes.
 */
export default function PayoutsClient() {
  const searchParams = useSearchParams();
  const justReturned = searchParams.get("done") === "1";

  const status = api.payment.payoutStatus.useQuery();
  const utils = api.useUtils();

  const start = api.payment.startOnboarding.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  const refresh = api.payment.refreshPayoutStatus.useMutation({
    onSuccess: () => utils.payment.payoutStatus.invalidate(),
  });

  // Coming back from Stripe, the webhook may not have landed yet. Ask Stripe
  // directly rather than showing a stale "not set up" to someone who just
  // finished setting up.
  useEffect(() => {
    if (justReturned) refresh.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justReturned]);

  if (status.isPending) {
    return (
      <AppPage width="form" className="max-w-xl space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 rounded-xl" />
      </AppPage>
    );
  }

  if (!status.data?.configured) {
    return (
      <AppPage width="form" className="max-w-xl">
        <EmptyState
          title="Payments are not enabled"
          description="This deployment has no payment provider configured, so payouts cannot be set up yet."
        />
      </AppPage>
    );
  }

  if (!status.data.hasProfile) {
    return (
      <AppPage width="form" className="max-w-xl">
        <EmptyState
          title="Create a provider profile first"
          description="Payouts are for people offering services. Set up your profile and we can connect your payout account."
          action={
            <Button asChild>
              <Link href="/onboarding/provider">Set up profile</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  const enabled = status.data.enabled;

  return (
    <AppPage width="form" className="max-w-xl space-y-6">
      <PageHeader
        title="Payouts"
        description="Where your money lands when a customer approves your work."
      />

      <section className="border-border bg-card space-y-3 rounded-xl border p-4">
        {enabled ? (
          <>
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="text-nav-active size-4" aria-hidden />
              Payouts are active
            </p>
            <p className="text-muted-foreground text-sm">
              You can be hired. When a customer approves your work, the payment
              they already funded is transferred to you, minus the platform fee
              and any advertising you have used.
            </p>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? "Opening…" : "Update payout details"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">
              {status.data.started
                ? "Payout setup is unfinished"
                : "Set up payouts to get hired"}
            </p>
            <p className="text-muted-foreground text-sm">
              Stripe collects your bank details, identity and tax information on
              their own secure pages — we never see or store them.{" "}
              <strong className="text-foreground font-medium">
                Customers can&rsquo;t hire you until this is done
              </strong>
              , because their money would have nowhere to go.
            </p>
            <Button
              className="min-h-11 w-full sm:w-auto"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending
                ? "Opening…"
                : status.data.started
                  ? "Finish setup"
                  : "Set up payouts"}
            </Button>
            {start.error ? (
              <p className="text-destructive text-sm">{start.error.message}</p>
            ) : null}
            {refresh.isPending ? (
              <p className="text-muted-foreground text-sm">
                Checking with Stripe…
              </p>
            ) : null}
          </>
        )}
      </section>
    </AppPage>
  );
}
