import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { env } from "@/env";
import { db } from "@/server/db";
import { payments, workOrders } from "@/server/db/schema";
import { syncPayoutStatus } from "@/server/services/payments/connect";
import { stripe } from "@/server/services/payments/stripe";
import { notify } from "@/server/services/notify";

/**
 * Stripe decides what happened to money; this route is how we find out. The
 * client is never trusted to tell us a payment succeeded — it can lie, and it
 * can also simply close the tab before telling us the truth.
 */
export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhooks not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // Raw body: any parsing or re-serialising breaks the signature.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("[stripe] bad signature", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handle(event);
  } catch (error) {
    // 500 so Stripe retries. Swallowing this loses the money event forever.
    console.error(`[stripe] handler failed for ${event.type}`, error);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      // Funds are now held by the platform: escrow is genuinely open.
      const [payment] = await db
        .update(payments)
        .set({ status: "authorized", authorizedAt: new Date() })
        .where(eq(payments.stripePaymentIntentId, intent.id))
        .returning({
          workOrderId: payments.workOrderId,
          amount: payments.amount,
        });

      if (payment) {
        const [wo] = await db
          .select({
            title: workOrders.title,
            assigneeId: workOrders.assigneeId,
          })
          .from(workOrders)
          .where(eq(workOrders.id, payment.workOrderId))
          .limit(1);

        if (wo?.assigneeId) {
          await notify({
            userId: wo.assigneeId,
            title: `Payment secured for “${wo.title}”`,
            body: "The customer's payment is held. You get paid when they approve your work.",
            href: `/work/${payment.workOrderId}`,
          });
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.stripePaymentIntentId, intent.id));
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      if (typeof charge.payment_intent === "string") {
        await db
          .update(payments)
          .set({ status: "refunded" })
          .where(eq(payments.stripePaymentIntentId, charge.payment_intent));
      }
      break;
    }

    case "account.updated": {
      // Express onboarding is multi-step and can stall; this is the only
      // authority on whether a provider can actually be paid.
      await syncPayoutStatus(event.data.object.id);
      break;
    }

    default:
      // Unhandled types are fine — acknowledge so Stripe stops retrying.
      break;
  }
}
