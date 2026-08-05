import { describe, expect, it } from "vitest";

import { MockOrchestratorModel } from "./model/mock-orchestrator-model";

describe("MockOrchestratorModel", () => {
  const model = new MockOrchestratorModel();

  it("drafts even a very short message instead of asking questions", async () => {
    const plan = await model.plan({ message: "Help", userId: "u1" });
    expect(plan.kind).toBe("work_draft");
  });

  it("drafts licensed electrical work in plain language", async () => {
    const plan = await model.plan({
      message: "Replace a residential electrical panel this week",
      userId: "u1",
    });
    expect(plan.kind).toBe("work_draft");
    if (plan.kind !== "work_draft") return;
    expect(plan.plan.plainRequirements.some((r: string) => /licensed/i.test(r))).toBe(
      true,
    );
    expect(plan.plan.needsConfirmation).toBe(true);
  });

  it("drafts simple photo work without governance jargon", async () => {
    const plan = await model.plan({
      message: "Photograph every public entrance at this storefront",
      userId: "u1",
    });
    expect(plan.kind).toBe("work_draft");
    if (plan.kind !== "work_draft") return;
    expect(JSON.stringify(plan)).not.toMatch(/Governance Level/i);
    expect(plan.plan.budgetAmount).toBeGreaterThan(0);
  });
});
