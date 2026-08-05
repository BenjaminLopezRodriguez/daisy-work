import { describe, expect, it } from "vitest";

import {
  ATTRIBUTION_WINDOW_DAYS,
  auctionScore,
  hireCharge,
  isAttributable,
  isServable,
  rankAds,
  remainingBudget,
} from "./auction";

const ad = (over: Partial<Parameters<typeof isServable>[0]> = {}) => ({
  id: "a",
  costPerHireCents: 500,
  budgetCents: 10_000,
  spentCents: 0,
  hireCount: 0,
  clickCount: 0,
  ...over,
});

describe("serving", () => {
  it("serves an ad that can still pay for its next hire", () => {
    expect(isServable(ad())).toBe(true);
  });

  it("stops serving once the remaining budget cannot cover one more hire", () => {
    expect(isServable(ad({ spentCents: 9_600 }))).toBe(false);
    // Exactly one hire left is still servable.
    expect(isServable(ad({ spentCents: 9_500 }))).toBe(true);
  });

  it("never serves an ad with no bid — that is free placement", () => {
    expect(isServable(ad({ costPerHireCents: 0 }))).toBe(false);
  });

  it("floors the remaining budget so overspend cannot read as credit", () => {
    expect(remainingBudget({ budgetCents: 100, spentCents: 250 })).toBe(0);
  });
});

describe("auction ranking", () => {
  it("ranks a higher bid above a lower one, all else equal", () => {
    const [first] = rankAds(
      [
        ad({ id: "low", costPerHireCents: 200 }),
        ad({ id: "high", costPerHireCents: 900 }),
      ],
      2,
    );
    expect(first?.id).toBe("high");
  });

  it("lets a converting ad beat a higher bid that never converts", () => {
    const spammy = ad({
      id: "spam",
      costPerHireCents: 1000,
      clickCount: 100,
      hireCount: 1,
    });
    const good = ad({
      id: "good",
      costPerHireCents: 400,
      clickCount: 100,
      hireCount: 40,
    });
    expect(rankAds([spammy, good], 1)[0]?.id).toBe("good");
  });

  it("gives a brand-new ad a neutral quality so it can earn history", () => {
    const fresh = ad({ id: "fresh", costPerHireCents: 500 });
    const proven = ad({
      id: "proven",
      costPerHireCents: 500,
      clickCount: 100,
      hireCount: 10,
    });
    // Same bid, same effective quality — the new ad is not locked out.
    expect(auctionScore(fresh)).toBe(auctionScore(proven));
  });

  it("drops unservable ads entirely rather than ranking them low", () => {
    const broke = ad({ id: "broke", spentCents: 10_000 });
    expect(rankAds([broke, ad({ id: "ok" })], 5).map((a) => a.id)).toEqual([
      "ok",
    ]);
  });

  it("is stable for identical ads", () => {
    const ids = rankAds([ad({ id: "b" }), ad({ id: "a" })], 5).map((a) => a.id);
    expect(ids).toEqual(["a", "b"]);
  });
});

describe("attribution", () => {
  const now = new Date("2026-08-05T12:00:00Z");
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

  it("credits a click inside the window", () => {
    expect(
      isAttributable({ clickedAt: daysAgo(1), workOrderId: null }, now),
    ).toBe(true);
    expect(
      isAttributable(
        { clickedAt: daysAgo(ATTRIBUTION_WINDOW_DAYS), workOrderId: null },
        now,
      ),
    ).toBe(true);
  });

  it("expires a click past the window", () => {
    expect(
      isAttributable(
        { clickedAt: daysAgo(ATTRIBUTION_WINDOW_DAYS + 1), workOrderId: null },
        now,
      ),
    ).toBe(false);
  });

  it("bills one click at most once", () => {
    expect(
      isAttributable({ clickedAt: daysAgo(1), workOrderId: "wo_1" }, now),
    ).toBe(false);
  });
});

describe("hireCharge", () => {
  it("charges the bid when the budget covers it", () => {
    expect(
      hireCharge({ costPerHireCents: 500, budgetCents: 10_000, spentCents: 0 }),
    ).toBe(500);
  });

  it("never charges past the cap the advertiser set", () => {
    expect(
      hireCharge({
        costPerHireCents: 500,
        budgetCents: 10_000,
        spentCents: 9_800,
      }),
    ).toBe(200);
    expect(
      hireCharge({
        costPerHireCents: 500,
        budgetCents: 10_000,
        spentCents: 10_000,
      }),
    ).toBe(0);
  });
});
