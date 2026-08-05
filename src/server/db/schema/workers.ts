import { index } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import {
  credentialTypeEnum,
  verificationStatusEnum,
  workModeEnum,
} from "./enums";
import { users } from "./users";

export const workerProfiles = createTable(
  "worker_profile",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" })
      .unique(),
    headline: d.varchar({ length: 256 }).notNull(),
    biography: d.text().notNull().default(""),
    serviceAreas: d.text().array().notNull().default([]),
    workModes: workModeEnum("work_modes").array().notNull().default([]),
    hourlyRate: d.integer(),
    availability: d.varchar({ length: 256 }).notNull().default(""),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    rating: d.integer().notNull().default(0),
    completedJobs: d.integer().notNull().default(0),
    responseTimeHours: d.integer().notNull().default(24),
    location: d.varchar({ length: 256 }),
    /** 16:9 service / cover photo (UploadThing URL). */
    coverImageUrl: d.text(),
    /** Profile / service card views in marketplace. */
    profileViewCount: d.integer().notNull().default(0),
    /** CTA / contact clicks from service cards. */
    profileClickCount: d.integer().notNull().default(0),
    /**
     * Stripe Connect Express account. Stripe holds their bank details, tax
     * forms and identity — we never do.
     */
    stripeAccountId: d.varchar({ length: 255 }).unique(),
    /**
     * Mirrors `charges_enabled && payouts_enabled` from the account.updated
     * webhook. Onboarding is multi-step and can stall, so having an account is
     * not the same as being payable — this is the flag that gates hiring.
     */
    payoutsEnabled: d.boolean().notNull().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("worker_profile_user_idx").on(t.userId)],
);

export const skills = createTable("skill", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  name: d.varchar({ length: 128 }).notNull().unique(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const workerSkills = createTable(
  "worker_skill",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workerProfileId: d
      .uuid()
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "restrict" }),
    skillId: d
      .uuid()
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("worker_skill_profile_idx").on(t.workerProfileId),
    index("worker_skill_skill_idx").on(t.skillId),
  ],
);

export const credentials = createTable(
  "credential",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workerProfileId: d
      .uuid()
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "restrict" }),
    type: credentialTypeEnum("type").notNull(),
    title: d.varchar({ length: 256 }).notNull(),
    issuingAuthority: d.varchar({ length: 256 }).notNull(),
    jurisdiction: d.varchar({ length: 128 }),
    credentialNumber: d.varchar({ length: 128 }),
    issuedAt: d.timestamp({ withTimezone: true }).notNull(),
    expiresAt: d.timestamp({ withTimezone: true }),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    documentUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("credential_profile_idx").on(t.workerProfileId),
    index("credential_status_idx").on(t.verificationStatus),
  ],
);
