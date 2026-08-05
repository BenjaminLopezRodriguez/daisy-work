"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { env } from "@/env";
import { api } from "@/trpc/react";

// Module scope: loadStripe must not run on every render.
const stripePromise = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function StatusLine({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

/**
 * Money on the work order, from both sides.
 *
 * Escrow is the whole proposition — the customer's money is committed but not
 * handed over, and the provider can see that it is committed. Both facts have
 * to be visible or neither party gets the reassurance they are paying for.
 */
export function EscrowPanel({
  workOrderId,
  amountCents,
  isOwner,
  status,
}: {
  workOrderId: string;
  amountCents: number;
  isOwner: boolean;
  status: string;
}) {
  const payment = api.payment.forWorkOrder.useQuery({ workOrderId });
  const quote = api.payment.quote.useQuery({ amountCents });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const checkout = api.payment.checkout.useMutation({
    onSuccess: (data) => setClientSecret(data.clientSecret),
  });

  if (payment.isPending) return <Skeleton className="h-24 rounded-xl" />;

  const state = payment.data?.status;

  return (
    <section className="border-border bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Payment</h2>
        <p className="text-sm font-semibold tabular-nums">
          {formatMoney(amountCents, "USD")}
        </p>
      </div>

      {state === "released" ? (
        <StatusLine>
          Paid out{isOwner ? " to the provider" : ""}. This job is settled.
        </StatusLine>
      ) : state === "refunded" ? (
        <StatusLine>Refunded to the customer.</StatusLine>
      ) : state === "authorized" ? (
        <StatusLine>
          {isOwner
            ? "Your payment is held. It goes to the provider when you approve the work."
            : "The customer's payment is held. You get paid when they approve."}
        </StatusLine>
      ) : isOwner ? (
        <>
          <StatusLine>
            Nothing is charged until you confirm. Funds are held until you
            approve the work.
          </StatusLine>
          {quote.data ? (
            <dl className="text-muted-foreground space-y-1 text-xs">
              <div className="flex justify-between">
                <dt>Provider receives</dt>
                <dd className="tabular-nums">
                  {formatMoney(quote.data.providerReceives, "USD")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Platform fee</dt>
                <dd className="tabular-nums">
                  {formatMoney(quote.data.platformFee, "USD")}
                </dd>
              </div>
            </dl>
          ) : null}

          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <ConfirmForm workOrderId={workOrderId} />
            </Elements>
          ) : (
            <>
              <Button
                className="min-h-11 w-full"
                disabled={checkout.isPending || status === "draft"}
                onClick={() => checkout.mutate({ workOrderId })}
              >
                {checkout.isPending ? "Preparing…" : "Fund this job"}
              </Button>
              {checkout.error ? (
                <p className="text-destructive text-sm">
                  {checkout.error.message}
                </p>
              ) : null}
            </>
          )}
        </>
      ) : (
        <StatusLine>
          Waiting for the customer to fund this job. Do not start work until the
          payment shows as held.
        </StatusLine>
      )}
    </section>
  );
}

function ConfirmForm({ workOrderId }: { workOrderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const utils = api.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/work/${workOrderId}`,
      },
    });

    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      return;
    }
    // The webhook is what actually marks this authorized; refetching here just
    // shortens the wait for the person staring at the screen.
    await utils.payment.forWorkOrder.invalidate({ workOrderId });
  }

  return (
    <div className="space-y-3">
      <PaymentElement />
      <Button
        className="min-h-11 w-full"
        disabled={!stripe || busy}
        onClick={() => void confirm()}
      >
        {busy ? "Confirming…" : "Confirm payment"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
