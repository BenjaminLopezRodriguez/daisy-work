import { index } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import {
  assigneeTypeEnum,
  budgetTypeEnum,
  deliverableTypeEnum,
  requirementTypeEnum,
  riskLevelEnum,
  verificationStatusEnum,
  workModeEnum,
  workOrderStatusEnum,
} from "./enums";
import { organizations, users } from "./users";

export const workOrders = createTable(
  "work_order",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    title: d.varchar({ length: 512 }).notNull(),
    description: d.text().notNull(),
    requesterId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    organizationId: d
      .uuid()
      .references(() => organizations.id, { onDelete: "restrict" }),
    assigneeType: assigneeTypeEnum("assignee_type")
      .notNull()
      .default("unassigned"),
    assigneeId: d.uuid().references(() => users.id, { onDelete: "restrict" }),
    category: d.varchar({ length: 128 }).notNull(),
    workMode: workModeEnum("work_mode").notNull(),
    locationLabel: d.varchar({ length: 512 }),
    locationAddress: d.text(),
    locationLat: d.doublePrecision(),
    locationLng: d.doublePrecision(),
    riskLevel: riskLevelEnum("risk_level").notNull().default("level_1"),
    status: workOrderStatusEnum("status").notNull().default("draft"),
    budgetType: budgetTypeEnum("budget_type").notNull().default("fixed"),
    /** Integer minor units (cents). Never floating point. */
    budgetAmount: d.integer().notNull().default(0),
    currency: d.varchar({ length: 3 }).notNull().default("USD"),
    startsAt: d.timestamp({ withTimezone: true }),
    dueAt: d.timestamp({ withTimezone: true }),
    estimatedMinutes: d.integer(),
    acceptanceCriteria: d.text().array().notNull().default([]),
    progressPercent: d.integer().notNull().default(0),
    nextAction: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("work_order_status_idx").on(t.status),
    index("work_order_requester_idx").on(t.requesterId),
    index("work_order_assignee_idx").on(t.assigneeId),
    index("work_order_risk_idx").on(t.riskLevel),
  ],
);

export const workRequirements = createTable(
  "work_requirement",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    type: requirementTypeEnum("type").notNull(),
    label: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull().default(""),
    required: d.boolean().notNull().default(true),
    verificationMethod: d.varchar({ length: 128 }).notNull(),
    status: verificationStatusEnum("status").notNull().default("unverified"),
    explanation: d.text().notNull().default(""),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("work_requirement_wo_idx").on(t.workOrderId)],
);

export const deliverables = createTable(
  "deliverable",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    type: deliverableTypeEnum("type").notNull(),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull().default(""),
    required: d.boolean().notNull().default(true),
    validationRules: d.text().array().notNull().default([]),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("deliverable_wo_idx").on(t.workOrderId)],
);
