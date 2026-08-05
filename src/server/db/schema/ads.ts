import { index, pgEnum } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import { users } from "./users";

export const adAdvertiserTypeEnum = pgEnum("ad_advertiser_type", [
  "worker",
  "company",
]);

export const adPlacementEnum = pgEnum("ad_placement", [
  "landing",
  "marketplace",
  "work_feed",
]);

export const adStatusEnum = pgEnum("ad_status", ["active", "paused"]);

export const advertisements = createTable(
  "advertisement",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    advertiserType: adAdvertiserTypeEnum("advertiser_type").notNull(),
    /** Set for worker promos; optional for company ads. */
    ownerUserId: d.uuid().references(() => users.id, { onDelete: "set null" }),
    companyName: d.varchar({ length: 256 }),
    headline: d.varchar({ length: 128 }).notNull(),
    body: d.text().notNull().default(""),
    imageUrl: d.text(),
    ctaLabel: d.varchar({ length: 64 }).notNull().default("Learn more"),
    ctaUrl: d.text().notNull(),
    placement: adPlacementEnum("placement").notNull().default("marketplace"),
    status: adStatusEnum("status").notNull().default("active"),
    /** How many times the ad was shown. */
    impressionCount: d.integer().notNull().default(0),
    /** How many times the CTA was clicked. */
    clickCount: d.integer().notNull().default(0),
    /**
     * Pay-per-hire, not per impression or per click. What the advertiser is
     * willing to pay when an ad actually produces a hire, in integer cents.
     * Also the auction bid: higher bids rank higher for the same placement.
     */
    costPerHireCents: d.integer().notNull().default(0),
    /** Spend cap. The ad auto-pauses when `spentCents` would exceed it. */
    budgetCents: d.integer().notNull().default(0),
    /** Charged so far against this ad, in integer cents. */
    spentCents: d.integer().notNull().default(0),
    /** Hires attributed to this ad. The number the advertiser is buying. */
    hireCount: d.integer().notNull().default(0),
    startsAt: d.timestamp({ withTimezone: true }),
    endsAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("ad_placement_status_idx").on(t.placement, t.status),
    index("ad_owner_idx").on(t.ownerUserId),
  ],
);

/**
 * The link between "someone clicked this ad" and "someone got hired", which is
 * the only thing that makes pay-per-hire billable.
 *
 * A row is written on click and stays unconsumed until that same person hires
 * that same advertiser. If they never do, it costs nothing — that is the whole
 * proposition. One row is consumed at most once (`workOrderId` unique), so a
 * single click can never be billed for two jobs.
 */
export const adAttributions = createTable(
  "ad_attribution",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    advertisementId: d
      .uuid()
      .notNull()
      .references(() => advertisements.id, { onDelete: "cascade" }),
    /** Who clicked. Anonymous clicks are not attributable, so are not stored. */
    viewerUserId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The advertiser this click should be credited to on a later hire. */
    advertiserUserId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clickedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    /** Set when this click turns into a hire. Null while unconsumed. */
    workOrderId: d.uuid().unique(),
    /** What we actually charged, snapshotted — the bid can change later. */
    chargedCents: d.integer(),
    chargedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("ad_attr_lookup_idx").on(
      t.viewerUserId,
      t.advertiserUserId,
      t.clickedAt,
    ),
    index("ad_attr_ad_idx").on(t.advertisementId),
  ],
);
