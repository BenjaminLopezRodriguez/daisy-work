import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import {
  adAttributions,
  advertisements,
  payments,
  workerProfiles,
  workOrders,
} from "@/server/db/schema";
import { hireCharge, isAttributable } from "@/server/services/ads/auction";

import { canRefund, canRelease, hireBlockReason, platformFee } from "./escrow";
import { ensureCustomer } from "./connect";
import { feeBps, idempotencyKey, stripe } from "./stripe";

export { hireBlockReason } from "./escrow";

/**
 * Start escrow for a hire: a PaymentIntent the customer confirms, whose funds
 * the platform holds until the work is approved.
 *
 * Returns the client secret the checkout UI needs. The row is written before
 * confirmation, so a customer who abandons checkout leaves a `pending` payment
 * rather than an invisible one.
 */
export async function openEscrow(input: {
  workOrderId: string;
  customerUserId: string;
  providerUserId: string;
  amountCents: number;
}): Promise<{ clientSecret: string; paymentId: string }> {
  const [profile] = await db
    .select({ payoutsEnabled: workerProfiles.payoutsEnabled })
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, input.providerUserId))
    .limit(1);

  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.workOrderId, input.workOrderId))
    .limit(1);

  const block = hireBlockReason({
    budgetAmount: input.amountCents,
    providerPayoutsEnabled: Boolean(profile?.payoutsEnabled),
    existingPaymentStatus: existing?.status ?? null,
  });
  if (block) throw new Error(block);

  const customerId = await ensureCustomer(input.customerUserId);

  const intent = await stripe().paymentIntents.create(
    {
      amount: input.amountCents,
      currency: "usd",
      customer: customerId,
      // Funds land in the platform account and are transferred on approval —
      // this is what makes it escrow rather than a direct payment.
      automatic_payment_methods: { enabled: true },
      metadata: {
        workOrderId: input.workOrderId,
        providerUserId: input.providerUserId,
      },
    },
    { idempotencyKey: idempotencyKey("escrow", input.workOrderId) },
  );

  if (!intent.client_secret)
    throw new Error("Stripe returned no client secret");

  const values = {
    workOrderId: input.workOrderId,
    amount: input.amountCents,
    currency: "USD",
    status: "pending" as const,
    stripePaymentIntentId: intent.id,
    platformFeeAmount: platformFee(input.amountCents, feeBps()),
    idempotencyKey: idempotencyKey("escrow", input.workOrderId),
  };

  const [row] = existing
    ? await db
        .update(payments)
        .set(values)
        .where(eq(payments.id, existing.id))
        .returning({ id: payments.id })
    : await db.insert(payments).values(values).returning({ id: payments.id });

  return { clientSecret: intent.client_secret, paymentId: row!.id };
}

/**
 * Release held funds to the provider, net of the platform fee and any ad spend
 * this hire owes. Deducting the ad charge here rather than billing the
 * provider separately means advertising can never produce a failed payment or
 * a debt to chase — it comes out of money we are already holding.
 */
export async function releaseEscrow(workOrderId: string): Promise<void> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.workOrderId, workOrderId))
    .limit(1);

  if (!payment) return; // Job predates payments, or was never funded.
  if (!canRelease(payment.status)) return;

  const [wo] = await db
    .select({ assigneeId: workOrders.assigneeId })
    .from(workOrders)
    .where(eq(workOrders.id, workOrderId))
    .limit(1);
  if (!wo?.assigneeId) throw new Error("No provider to pay");

  const [profile] = await db
    .select({ stripeAccountId: workerProfiles.stripeAccountId })
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, wo.assigneeId))
    .limit(1);
  if (!profile?.stripeAccountId)
    throw new Error("Provider has no payout account");

  const adCharge = await settleAdCharge(workOrderId);
  const payout = payment.amount - payment.platformFeeAmount - adCharge;
  if (payout <= 0) throw new Error("Nothing left to pay out");

  const transfer = await stripe().transfers.create(
    {
      amount: payout,
      currency: "usd",
      destination: profile.stripeAccountId,
      transfer_group: workOrderId,
      metadata: { workOrderId, adChargeCents: String(adCharge) },
    },
    { idempotencyKey: idempotencyKey("release", workOrderId) },
  );

  await db
    .update(payments)
    .set({
      status: "released",
      stripeTransferId: transfer.id,
      releasedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));
}

/** Give the money back. Only possible while it is still held. */
export async function refundEscrow(workOrderId: string): Promise<void> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.workOrderId, workOrderId))
    .limit(1);

  if (!payment || !canRefund(payment.status)) return;
  if (!payment.stripePaymentIntentId) return;

  // Nothing was ever captured, so there is nothing to give back.
  if (payment.status === "pending") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, payment.id));
    return;
  }

  const refund = await stripe().refunds.create(
    { payment_intent: payment.stripePaymentIntentId },
    { idempotencyKey: idempotencyKey("refund", workOrderId) },
  );

  await db
    .update(payments)
    .set({ status: "refunded", stripeRefundId: refund.id })
    .where(eq(payments.id, payment.id));
}

/**
 * If this hire came from an ad click, bill the advertiser for it — once.
 * Returns the amount charged so the payout can be reduced by it.
 */
async function settleAdCharge(workOrderId: string): Promise<number> {
  const [claimed] = await db
    .select({
      id: adAttributions.id,
      chargedCents: adAttributions.chargedCents,
    })
    .from(adAttributions)
    .where(eq(adAttributions.workOrderId, workOrderId))
    .limit(1);

  return claimed?.chargedCents ?? 0;
}

/**
 * Called at hire time: find the click that produced this hire and consume it.
 * Charging is recorded here and settled out of the payout at release, so an
 * advertiser whose hire is later refunded is never billed for it.
 */
export async function claimAdAttribution(input: {
  workOrderId: string;
  customerUserId: string;
  providerUserId: string;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();

  const rows = await db
    .select({
      attribution: adAttributions,
      ad: advertisements,
    })
    .from(adAttributions)
    .innerJoin(
      advertisements,
      eq(advertisements.id, adAttributions.advertisementId),
    )
    .where(
      and(
        eq(adAttributions.viewerUserId, input.customerUserId),
        eq(adAttributions.advertiserUserId, input.providerUserId),
        isNull(adAttributions.workOrderId),
      ),
    )
    .orderBy(desc(adAttributions.clickedAt))
    .limit(5);

  // Last click wins, which is the convention every ad platform uses.
  const hit = rows.find((r) =>
    isAttributable(
      { clickedAt: r.attribution.clickedAt, workOrderId: null },
      now,
    ),
  );
  if (!hit) return 0;

  const charge = hireCharge(hit.ad);
  if (charge <= 0) return 0;

  const spent = hit.ad.spentCents + charge;
  await db
    .update(advertisements)
    .set({
      spentCents: spent,
      hireCount: hit.ad.hireCount + 1,
      // Out of budget for another hire: stop serving rather than serve for free.
      ...(spent + hit.ad.costPerHireCents > hit.ad.budgetCents
        ? { status: "paused" as const }
        : {}),
    })
    .where(eq(advertisements.id, hit.ad.id));

  await db
    .update(adAttributions)
    .set({
      workOrderId: input.workOrderId,
      chargedCents: charge,
      chargedAt: now,
    })
    .where(eq(adAttributions.id, hit.attribution.id));

  return charge;
}
