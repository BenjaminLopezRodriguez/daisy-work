import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import {
  actorTypeEnum,
  contractStatusEnum,
  deliverableTypeEnum,
  milestoneStatusEnum,
  paymentStatusEnum,
  submissionStatusEnum,
  verificationStatusEnum,
} from "./enums";
import { users } from "./users";
import { workOrders } from "./work-orders";

export const submissions = createTable(
  "submission",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    submittedBy: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: submissionStatusEnum("status").notNull().default("draft"),
    notes: d.text().notNull().default(""),
    submittedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("submission_wo_idx").on(t.workOrderId),
    index("submission_status_idx").on(t.status),
  ],
);

export const evidence = createTable(
  "evidence",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    submissionId: d
      .uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: "restrict" }),
    type: deliverableTypeEnum("type").notNull(),
    /** Storage key / path — not a public URL by default. */
    storageKey: d.text().notNull(),
    caption: d.varchar({ length: 512 }).notNull().default(""),
    metadataJson: d.text().notNull().default("{}"),
    capturedAt: d.timestamp({ withTimezone: true }),
    locationLabel: d.varchar({ length: 512 }),
    locationLat: d.doublePrecision(),
    locationLng: d.doublePrecision(),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("evidence_submission_idx").on(t.submissionId)],
);

export const contracts = createTable(
  "contract",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    version: d.integer().notNull().default(1),
    contractType: d.varchar({ length: 64 }).notNull(),
    termsJson: d.text().notNull().default("[]"),
    cancellationTerms: d.text().notNull().default(""),
    disputeProcess: d.text().notNull().default(""),
    acceptedByRequesterAt: d.timestamp({ withTimezone: true }),
    acceptedByWorkerAt: d.timestamp({ withTimezone: true }),
    status: contractStatusEnum("status").notNull().default("draft"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("contract_wo_idx").on(t.workOrderId)],
);

export const milestones = createTable(
  "milestone",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull().default(""),
    amount: d.integer().notNull(),
    dueAt: d.timestamp({ withTimezone: true }),
    status: milestoneStatusEnum("status").notNull().default("pending"),
    approvalMethod: d.varchar({ length: 64 }).notNull().default("requester"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("milestone_wo_idx").on(t.workOrderId)],
);

export const payments = createTable(
  "payment",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    milestoneId: d
      .uuid()
      .references(() => milestones.id, { onDelete: "restrict" }),
    amount: d.integer().notNull(),
    currency: d.varchar({ length: 3 }).notNull().default("USD"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    idempotencyKey: d.varchar({ length: 128 }).unique(),
    /**
     * Stripe is the source of truth for money; these are our handles on it.
     * The intent is captured at hire (funds held by the platform) and the
     * transfer is what moves them to the provider at approval.
     */
    stripePaymentIntentId: d.varchar({ length: 255 }).unique(),
    stripeTransferId: d.varchar({ length: 255 }),
    stripeRefundId: d.varchar({ length: 255 }),
    /** Our cut, in the same integer cents as `amount`. Never a float. */
    platformFeeAmount: d.integer().notNull().default(0),
    authorizedAt: d.timestamp({ withTimezone: true }),
    releasedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("payment_wo_idx").on(t.workOrderId),
    index("payment_status_idx").on(t.status),
  ],
);

export const reviews = createTable(
  "review",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    reviewerId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    subjectId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    rating: d.integer().notNull(),
    comment: d.text().notNull().default(""),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("review_wo_idx").on(t.workOrderId),
    index("review_subject_idx").on(t.subjectId),
    // One review per person per job — the DB, not the router, is what makes
    // "you already reviewed this" true under a double-submit.
    uniqueIndex("review_wo_reviewer_uq").on(t.workOrderId, t.reviewerId),
  ],
);

export const governanceEvents = createTable(
  "governance_event",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    actorType: actorTypeEnum("actor_type").notNull(),
    actorId: d.varchar({ length: 128 }).notNull(),
    actorName: d.varchar({ length: 256 }).notNull(),
    eventType: d.varchar({ length: 128 }).notNull(),
    explanation: d.text().notNull(),
    metadataJson: d.text().notNull().default("{}"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("governance_event_wo_idx").on(t.workOrderId),
    index("governance_event_created_idx").on(t.createdAt),
  ],
);
