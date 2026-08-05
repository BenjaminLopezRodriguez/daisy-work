import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { notifications } from "@/server/db/schema";

export const notificationRouter = createTRPCRouter({
  /** Newest first. The bell shows this list; there is no pagination yet. */
  list: protectedProcedure.query(async ({ ctx }) =>
    ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30),
  ),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          isNull(notifications.readAt),
        ),
      );
    return row?.value ?? 0;
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          isNull(notifications.readAt),
        ),
      );
    return { ok: true as const };
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id),
          ),
        );
      return { ok: true as const };
    }),
});
