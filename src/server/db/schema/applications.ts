import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import { users } from "./users";
import { workOrders } from "./work-orders";

/** A worker's application to a published job. One per (job, applicant). */
export const applications = createTable(
  "application",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    workOrderId: d
      .uuid()
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    applicantId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    message: d.varchar({ length: 1000 }),
    status: d.varchar({ length: 32 }).notNull().default("submitted"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("application_wo_applicant_uq").on(t.workOrderId, t.applicantId),
    index("application_applicant_idx").on(t.applicantId),
  ],
);
