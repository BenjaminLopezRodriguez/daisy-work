import { describe, expect, it } from "vitest";

import {
  canRefund,
  canRelease,
  DEFAULT_PLATFORM_FEE_BPS,
  hireBlockReason,
  platformFee,
  platformFeeBps,
  providerPayout,
} from "./escrow";

describe("platformFee", () => {
  it("takes the configured cut in integer cents", () => {
    expect(platformFee(10_000, 1000)).toBe(1000);
    expect(platformFee(4999, 1000)).toBe(499);
  });

  it("rounds down so the remainder goes to the provider, never to us", () => {
    // 1999 * 10% = 199.9 — the extra cent must not become platform revenue.
    expect(platformFee(1999, 1000)).toBe(199);
    expect(providerPayout(1999, 1000)).toBe(1800);
    expect(platformFee(1999, 1000) + providerPayout(1999, 1000)).toBe(1999);
  });

  it("never loses or invents a cent, at any amount", () => {
    for (const amount of [1, 7, 99, 333, 100_000, 999_999]) {
      expect(platformFee(amount, 1000) + providerPayout(amount, 1000)).toBe(
        amount,
      );
    }
  });

  it("rejects amounts that are not whole cents", () => {
    expect(() => platformFee(10.5, 1000)).toThrow();
    expect(() => platformFee(-1, 1000)).toThrow();
  });
});

describe("platformFeeBps", () => {
  it("falls back to the default for anything unusable", () => {
    for (const bad of [undefined, "", "abc", "-100", "9000", "10.5"]) {
      expect(platformFeeBps(bad)).toBe(DEFAULT_PLATFORM_FEE_BPS);
    }
  });

  it("accepts a sane configured rate", () => {
    expect(platformFeeBps("1500")).toBe(1500);
    expect(platformFeeBps("0")).toBe(0);
  });
});

describe("hireBlockReason", () => {
  const ok = { budgetAmount: 10_000, providerPayoutsEnabled: true };

  it("allows a funded hire of a payable provider", () => {
    expect(hireBlockReason(ok)).toBeNull();
  });

  it("blocks work that could never be paid for", () => {
    expect(hireBlockReason({ ...ok, budgetAmount: 0 })).toBe("NO_AMOUNT");
    expect(hireBlockReason({ ...ok, providerPayoutsEnabled: false })).toBe(
      "PROVIDER_CANNOT_RECEIVE",
    );
  });

  it("refuses to charge twice for the same job", () => {
    expect(
      hireBlockReason({ ...ok, existingPaymentStatus: "authorized" }),
    ).toBe("ALREADY_PAID");
    expect(hireBlockReason({ ...ok, existingPaymentStatus: "released" })).toBe(
      "ALREADY_PAID",
    );
  });

  it("lets a failed payment be retried", () => {
    expect(
      hireBlockReason({ ...ok, existingPaymentStatus: "failed" }),
    ).toBeNull();
  });
});

describe("release and refund gates", () => {
  it("only releases funds that are actually held", () => {
    expect(canRelease("authorized")).toBe(true);
    for (const s of ["pending", "released", "failed", "refunded"] as const) {
      expect(canRelease(s)).toBe(false);
    }
  });

  it("will not refund money that has already left", () => {
    expect(canRefund("authorized")).toBe(true);
    expect(canRefund("released")).toBe(false);
    expect(canRefund("refunded")).toBe(false);
  });
});
