import "server-only";

import { eq, or } from "drizzle-orm";

import {
  AssigneeType,
  BudgetType,
  RiskLevel,
  WorkMode,
  type WorkOrder,
  type WorkOrderLocation,
} from "@/domain";
import { db } from "@/server/db";
import { users, workOrders } from "@/server/db/schema";
import type { CreateDraftInput, WorkOrderService } from "@/server/services/types";
import {
  assignInputSchema,
  createDraftInputSchema,
  submitWorkInputSchema,
  workOrderIdSchema,
} from "@/server/services/types";

const RISK_TO_DB: Record<
  RiskLevel,
  "level_1" | "level_2" | "level_3" | "level_4"
> = {
  L1: "level_1",
  L2: "level_2",
  L3: "level_3",
  L4: "level_4",
};

const RISK_FROM_DB: Record<string, RiskLevel> = {
  level_1: RiskLevel.L1,
  level_2: RiskLevel.L2,
  level_3: RiskLevel.L3,
  level_4: RiskLevel.L4,
};

const MODE_TO_DB: Record<WorkMode, "remote" | "on_site" | "hybrid" | "local"> = {
  remote: "remote",
  on_site: "on_site",
  hybrid: "hybrid",
};

function mapLocation(
  row: typeof workOrders.$inferSelect,
): WorkOrderLocation | null {
  if (!row.locationLabel) return null;
  return {
    label: row.locationLabel,
    city: null,
    region: null,
    country: null,
    lat: row.locationLat,
    lng: row.locationLng,
  };
}

function mapWorkOrder(row: typeof workOrders.$inferSelect): WorkOrder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requesterId: row.requesterId,
    organizationId: row.organizationId,
    assigneeType:
      row.assigneeType === "agent"
        ? AssigneeType.Agent
        : row.assigneeType === "human"
          ? AssigneeType.Human
          : AssigneeType.Unassigned,
    assigneeId: row.assigneeId,
    category: row.category,
    workMode:
      row.workMode === "on_site" || row.workMode === "local"
        ? WorkMode.OnSite
        : row.workMode === "hybrid"
          ? WorkMode.Hybrid
          : WorkMode.Remote,
    location: mapLocation(row),
    riskLevel: RISK_FROM_DB[row.riskLevel] ?? RiskLevel.L1,
    status: row.status,
    budgetType:
      row.budgetType === "hourly"
        ? BudgetType.Hourly
        : row.budgetType === "milestone"
          ? BudgetType.Milestone
          : BudgetType.Fixed,
    budgetAmount: row.budgetAmount,
    currency: row.currency,
    startsAt: row.startsAt,
    dueAt: row.dueAt,
    createdAt: row.createdAt,
  };
}

function mapUser(row: typeof users.$inferSelect) {
  const identityStatus =
    row.identityStatus === "pending" ||
    row.identityStatus === "verified" ||
    row.identityStatus === "unverified"
      ? row.identityStatus
      : ("unverified" as const);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    accountType: row.accountType,
    identityStatus,
    trustLevel: row.trustLevel,
    createdAt: row.createdAt,
  };
}

/** Demo identity until real auth lands. Stable email → upserted user. */
export const DEMO_USER_EMAIL = "maya@daisy.work";

export async function ensureDemoUser() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_USER_EMAIL))
    .limit(1);
  if (existing) return mapUser(existing);

  const [created] = await db
    .insert(users)
    .values({
      name: "Maya Chen",
      email: DEMO_USER_EMAIL,
      accountType: "individual",
      identityStatus: "verified",
      trustLevel: 1,
    })
    .returning();

  if (!created) throw new Error("Failed to create demo user");
  return mapUser(created);
}

export function createDbWorkOrderService(): WorkOrderService {
  return {
    async createDraft(raw: CreateDraftInput) {
      const input = createDraftInputSchema.parse(raw);
      const modeKey = input.workMode;
      const mode =
        modeKey === "remote" || modeKey === "on_site" || modeKey === "hybrid"
          ? MODE_TO_DB[modeKey]
          : "remote";
      const [row] = await db
        .insert(workOrders)
        .values({
          title: input.title,
          description: input.description,
          requesterId: input.requesterId,
          category: input.category,
          workMode: mode,
          status: "draft",
          budgetType: "fixed",
          budgetAmount: input.budgetAmount,
          currency: input.currency,
          riskLevel: RISK_TO_DB.L1,
          assigneeType: "unassigned",
        })
        .returning();
      if (!row) throw new Error("Failed to create draft");
      return mapWorkOrder(row);
    },

    async publish(raw) {
      const { workOrderId } = workOrderIdSchema.parse(raw);
      const [row] = await db
        .update(workOrders)
        .set({ status: "published" })
        .where(eq(workOrders.id, workOrderId))
        .returning();
      if (!row) throw new Error("Work order not found");
      return mapWorkOrder(row);
    },

    async assign(raw) {
      const input = assignInputSchema.parse(raw);
      const [row] = await db
        .update(workOrders)
        .set({
          assigneeId: input.assigneeId,
          assigneeType: input.assigneeType === "agent" ? "agent" : "human",
          status: "assigned",
        })
        .where(eq(workOrders.id, input.workOrderId))
        .returning();
      if (!row) throw new Error("Work order not found");
      return mapWorkOrder(row);
    },

    async submit(raw) {
      const input = submitWorkInputSchema.parse(raw);
      const [row] = await db
        .update(workOrders)
        .set({ status: "submitted" })
        .where(eq(workOrders.id, input.workOrderId))
        .returning();
      if (!row) throw new Error("Work order not found");
      return {
        workOrder: mapWorkOrder(row),
        submission: {
          id: `sub_${Date.now()}`,
          workOrderId: row.id,
          submittedBy: input.submittedBy,
          status: "submitted" as const,
          notes: input.notes ?? null,
          submittedAt: new Date(),
        },
      };
    },

    async approve(raw) {
      const { workOrderId } = workOrderIdSchema.parse(raw);
      const [row] = await db
        .update(workOrders)
        .set({ status: "approved" })
        .where(eq(workOrders.id, workOrderId))
        .returning();
      if (!row) throw new Error("Work order not found");
      return mapWorkOrder(row);
    },

    async getById(workOrderId) {
      const [row] = await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, workOrderId))
        .limit(1);
      return row ? mapWorkOrder(row) : null;
    },

    async listForUser(userId: string) {
      const rows = await db
        .select()
        .from(workOrders)
        .where(
          or(
            eq(workOrders.requesterId, userId),
            eq(workOrders.assigneeId, userId),
          ),
        );
      return rows.map(mapWorkOrder);
    },
  };
}
