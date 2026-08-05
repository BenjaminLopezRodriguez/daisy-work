/**
 * Pay-per-hire advertising, Facebook's shape adapted to a labour marketplace.
 *
 * Facebook charges per outcome and ranks by bid × quality rather than bid
 * alone, so the highest bidder cannot buy a slot with a bad ad. Same here, with
 * the outcome being a hire: an advertiser pays only when someone who clicked
 * their ad actually hires them. Impressions and clicks stay free.
 *
 * No Stripe, no database — just the rules, so they can be tested cheaply.
 */

/** How long a click stays creditable. Longer than a browse, shorter than a habit. */
export const ATTRIBUTION_WINDOW_DAYS = 30;

export type AdCandidate = {
  id: string;
  costPerHireCents: number;
  budgetCents: number;
  spentCents: number;
  /** Outcomes so far, used as the quality signal. */
  hireCount: number;
  clickCount: number;
};

/** Budget left, floored at zero. */
export function remainingBudget(ad: {
  budgetCents: number;
  spentCents: number;
}): number {
  return Math.max(0, ad.budgetCents - ad.spentCents);
}

/**
 * An ad may only be shown if it could still be paid for. Serving an ad whose
 * next hire cannot be billed is giving away placement.
 */
export function isServable(ad: AdCandidate): boolean {
  if (ad.costPerHireCents <= 0) return false;
  return remainingBudget(ad) >= ad.costPerHireCents;
}

/**
 * Bid × quality, as an integer score. Quality is the click-to-hire rate, which
 * is the signal we actually have — an ad that gets clicked and never converts
 * is wasting the slot regardless of what it bids.
 *
 * Ads with too little history sit at the neutral rate rather than at zero, or
 * a new ad could never win a slot and could never earn history.
 */
const NEUTRAL_QUALITY = 0.1;
const MIN_CLICKS_FOR_QUALITY = 20;

export function qualityScore(ad: AdCandidate): number {
  if (ad.clickCount < MIN_CLICKS_FOR_QUALITY) return NEUTRAL_QUALITY;
  return ad.hireCount / ad.clickCount;
}

export function auctionScore(ad: AdCandidate): number {
  return Math.round(ad.costPerHireCents * qualityScore(ad) * 100);
}

/**
 * Rank servable ads for a slot. Ties break on id so the order is stable
 * between renders rather than shuffling under the reader.
 */
export function rankAds<T extends AdCandidate>(ads: T[], limit: number): T[] {
  return ads
    .filter(isServable)
    .sort(
      (a, b) =>
        auctionScore(b) - auctionScore(a) ||
        b.costPerHireCents - a.costPerHireCents ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

/**
 * Whether a recorded click can still be billed as a hire.
 *
 * `now` is a parameter rather than read from the clock so this is testable and
 * so the caller decides what "now" means.
 */
export function isAttributable(
  attribution: { clickedAt: Date; workOrderId: string | null },
  now: Date,
): boolean {
  if (attribution.workOrderId) return false; // already consumed
  const ageMs = now.getTime() - attribution.clickedAt.getTime();
  return ageMs >= 0 && ageMs <= ATTRIBUTION_WINDOW_DAYS * 86_400_000;
}

/**
 * What to charge for a hire. Never more than the budget left, so an advertiser
 * cannot be billed past the cap they set even if the bid rose after the click.
 */
export function hireCharge(ad: {
  costPerHireCents: number;
  budgetCents: number;
  spentCents: number;
}): number {
  return Math.min(ad.costPerHireCents, remainingBudget(ad));
}
