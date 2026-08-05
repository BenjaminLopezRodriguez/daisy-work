/**
 * The escrow state machine, with no Stripe in it.
 *
 * Money bugs are the expensive kind, so the rules about *when* funds may move
 * live here as pure functions that can be tested without a network, a webhook,
 * or a test-mode account. The Stripe calls are a thin layer on top that asks
 * these questions first.
 */

export type PaymentStatus =
  "pending" | "authorized" | "released" | "failed" | "refunded";

/** Basis points so a 12.5% rate never needs a float. 1000 = 10%. */
export const DEFAULT_PLATFORM_FEE_BPS = 1000;

export function platformFeeBps(raw: string | undefined): number {
  // `Number("")` is 0, so an unset variable would otherwise read as a 0% fee
  // rather than as "not configured". Silent free is worse than a default.
  if (!raw?.trim()) return DEFAULT_PLATFORM_FEE_BPS;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
    return DEFAULT_PLATFORM_FEE_BPS;
  }
  return parsed;
}

/**
 * The platform's cut of an amount in integer cents. Rounds down, so rounding
 * error always lands in the provider's favour rather than ours.
 */
export function platformFee(amountCents: number, feeBps: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("amountCents must be a non-negative integer");
  }
  return Math.floor((amountCents * feeBps) / 10_000);
}

/** What the provider actually receives. */
export function providerPayout(amountCents: number, feeBps: number): number {
  return amountCents - platformFee(amountCents, feeBps);
}

export type HireBlock =
  "NO_AMOUNT" | "PROVIDER_CANNOT_RECEIVE" | "ALREADY_PAID";

/**
 * Whether a hire is allowed to take the customer's money. A job with no budget
 * or a provider who cannot be paid out must fail loudly at hire time — the
 * alternative is work performed against a payment that can never land.
 */
export function hireBlockReason(input: {
  budgetAmount: number;
  providerPayoutsEnabled: boolean;
  existingPaymentStatus?: PaymentStatus | null;
}): HireBlock | null {
  if (
    input.existingPaymentStatus === "authorized" ||
    input.existingPaymentStatus === "released"
  ) {
    return "ALREADY_PAID";
  }
  if (!Number.isInteger(input.budgetAmount) || input.budgetAmount <= 0) {
    return "NO_AMOUNT";
  }
  if (!input.providerPayoutsEnabled) return "PROVIDER_CANNOT_RECEIVE";
  return null;
}

/** Funds may only be released out of a held (authorized) payment. */
export function canRelease(status: PaymentStatus): boolean {
  return status === "authorized";
}

/**
 * Refundable while held. A released payment is gone — clawing it back is a
 * dispute, not a refund, and it is deliberately not modelled here.
 */
export function canRefund(status: PaymentStatus): boolean {
  return status === "authorized" || status === "pending";
}
