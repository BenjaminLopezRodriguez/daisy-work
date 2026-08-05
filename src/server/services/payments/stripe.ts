import "server-only";

import Stripe from "stripe";

import { env } from "@/env";
import { platformFeeBps } from "./escrow";

/**
 * One client for the whole app. Pinned API version: Stripe ships breaking
 * changes behind version strings, and money code must not start behaving
 * differently because a dependency was bumped.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set — payments are unavailable");
  }
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    // Money calls are worth retrying; the SDK pairs this with idempotency keys.
    maxNetworkRetries: 2,
  });
  return client;
}

export function paymentsConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function feeBps(): number {
  return platformFeeBps(env.PLATFORM_FEE_BPS);
}

/**
 * Deterministic idempotency keys. A retried hire must never charge twice, and
 * the work order id is the natural unit of "the same charge".
 */
export function idempotencyKey(action: string, id: string): string {
  return `daisywork_${action}_${id}`;
}
