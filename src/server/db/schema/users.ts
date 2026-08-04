import { index } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import {
  accountTypeEnum,
  billingStatusEnum,
  identityStatusEnum,
  verificationStatusEnum,
} from "./enums";

export const users = createTable(
  "user",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    name: d.varchar({ length: 256 }).notNull().default(""),
    email: d.varchar({ length: 320 }).notNull().unique(),
    avatar: d.text(),
    /** Auth.js adapter columns. */
    emailVerified: d.timestamp({ withTimezone: true }),
    image: d.text(),
    accountType: accountTypeEnum("account_type").notNull().default("individual"),
    identityStatus: identityStatusEnum("identity_status")
      .notNull()
      .default("unverified"),
    trustLevel: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("user_email_idx").on(t.email)],
);

export const organizations = createTable(
  "organization",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    name: d.varchar({ length: 256 }).notNull(),
    slug: d.varchar({ length: 128 }).notNull().unique(),
    logo: d.text(),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    billingStatus: billingStatusEnum("billing_status")
      .notNull()
      .default("active"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("organization_slug_idx").on(t.slug)],
);

export const organizationMembers = createTable(
  "organization_member",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    organizationId: d
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: d.varchar({ length: 64 }).notNull().default("member"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("org_member_org_idx").on(t.organizationId),
    index("org_member_user_idx").on(t.userId),
  ],
);
