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
    ownerUserId: d
      .uuid()
      .references(() => users.id, { onDelete: "set null" }),
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
