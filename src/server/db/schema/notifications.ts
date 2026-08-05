import { index } from "drizzle-orm/pg-core";

import { createTable } from "./_base";
import { users } from "./users";

/**
 * One row per thing the user should know about. Title/body/href are stored
 * denormalised so the bell and the email render the same text without joining
 * back to whatever entity produced it.
 */
export const notifications = createTable(
  "notification",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 256 }).notNull(),
    body: d.varchar({ length: 1000 }).notNull().default(""),
    /** In-app destination, always app-relative. */
    href: d.varchar({ length: 512 }).notNull(),
    readAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("notification_user_created_idx").on(t.userId, t.createdAt)],
);
