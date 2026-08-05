import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { users, workerProfiles } from "@/server/db/schema";

import { idempotencyKey, stripe } from "./stripe";

function baseUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

/**
 * Express accounts: Stripe collects the provider's identity, bank details and
 * tax forms on their own hosted pages. We never see any of it, which is the
 * entire reason to use Connect rather than storing payout details ourselves.
 */
export async function ensureConnectAccount(userId: string): Promise<string> {
  const [profile] = await db
    .select({
      id: workerProfiles.id,
      stripeAccountId: workerProfiles.stripeAccountId,
    })
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, userId))
    .limit(1);

  if (!profile) throw new Error("Create a provider profile first");
  if (profile.stripeAccountId) return profile.stripeAccountId;

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const account = await stripe().accounts.create(
    {
      type: "express",
      email: user?.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: "individual",
      metadata: { daisyworkUserId: userId },
    },
    { idempotencyKey: idempotencyKey("connect_account", userId) },
  );

  await db
    .update(workerProfiles)
    .set({ stripeAccountId: account.id })
    .where(eq(workerProfiles.id, profile.id));

  return account.id;
}

/**
 * Account links are single-use and expire in minutes, so one is minted per
 * visit rather than stored.
 */
export async function onboardingLink(userId: string): Promise<string> {
  const accountId = await ensureConnectAccount(userId);
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${baseUrl()}/account/payouts?refresh=1`,
    return_url: `${baseUrl()}/account/payouts?done=1`,
  });
  return link.url;
}

/**
 * Mirror Stripe's verdict into our `payoutsEnabled` flag. Called from the
 * webhook, and also on demand so a provider who just finished onboarding is
 * not left waiting on webhook delivery.
 */
export async function syncPayoutStatus(accountId: string): Promise<boolean> {
  const account = await stripe().accounts.retrieve(accountId);
  const enabled = Boolean(account.charges_enabled && account.payouts_enabled);

  await db
    .update(workerProfiles)
    .set({ payoutsEnabled: enabled })
    .where(eq(workerProfiles.stripeAccountId, accountId));

  return enabled;
}

/** Reusable customer so a returning hirer keeps their saved cards. */
export async function ensureCustomer(userId: string): Promise<string> {
  const [user] = await db
    .select({
      email: users.email,
      name: users.name,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create(
    {
      email: user.email,
      name: user.name || undefined,
      metadata: { daisyworkUserId: userId },
    },
    { idempotencyKey: idempotencyKey("customer", userId) },
  );

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}
