import { index, pgEnum } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import { users } from "./users";
import { workerProfiles } from "./workers";

export const serviceListingStatusEnum = pgEnum("service_listing_status", [
  "active",
  "paused",
]);

/** Productized service a worker offers (Fiverr-lite package). */
export const serviceListings = createTable(
  "service_listing",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workerProfileId: d
      .uuid()
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    ownerUserId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull().default(""),
    /** Fixed package price in cents. */
    priceCents: d.integer().notNull().default(0),
    coverImageUrl: d.text(),
    tags: d.text().array().notNull().default([]),
    status: serviceListingStatusEnum("status").notNull().default("active"),
    viewCount: d.integer().notNull().default(0),
    clickCount: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("service_listing_owner_idx").on(t.ownerUserId),
    index("service_listing_profile_idx").on(t.workerProfileId),
    index("service_listing_status_idx").on(t.status),
  ],
);
