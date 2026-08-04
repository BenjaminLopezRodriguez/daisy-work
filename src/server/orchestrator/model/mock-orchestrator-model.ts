import type { OrchestratorInput, OrchestratorModel, OrchestratorPlan, WorkPlan } from "../orchestrator.types";

function inferPlan(message: string): WorkPlan {
  const lower = message.toLowerCase();
  const electrical =
    lower.includes("electric") ||
    lower.includes("outlet") ||
    lower.includes("panel") ||
    lower.includes("wiring");
  const photo =
    lower.includes("photo") ||
    lower.includes("picture") ||
    lower.includes("storefront") ||
    lower.includes("entrance");
  const remote =
    lower.includes("review") ||
    lower.includes("contract") ||
    lower.includes("spreadsheet") ||
    lower.includes("remote");

  if (electrical) {
    return {
      title: message.slice(0, 72).trim() || "Electrical work",
      summary: message.trim(),
      category: "Electrical",
      workMode: "on_site",
      plainRequirements: [
        "Needs a licensed electrician",
        "Insurance on file before start",
        "Payment protected until you approve",
      ],
      deliverables: ["Before-and-after photos", "Short completion notes"],
      budgetAmount: 45000,
      currency: "USD",
      riskHint: "Licensed on-site work",
      needsConfirmation: true,
    };
  }

  if (photo) {
    return {
      title: message.slice(0, 72).trim() || "Photo verification",
      summary: message.trim(),
      category: "Field verification",
      workMode: "on_site",
      plainRequirements: [
        "Basic identity verified",
        "Requires two clear photos",
        "Payment protected until you approve",
      ],
      deliverables: ["Photo", "Text response"],
      budgetAmount: 2500,
      currency: "USD",
      riskHint: "Simple field check",
      needsConfirmation: false,
    };
  }

  if (remote) {
    return {
      title: message.slice(0, 72).trim() || "Remote task",
      summary: message.trim(),
      category: "Professional",
      workMode: "remote",
      plainRequirements: [
        "Clear written deliverable",
        "Payment protected until you approve",
      ],
      deliverables: ["File", "Text response"],
      budgetAmount: 12000,
      currency: "USD",
      riskHint: "Remote professional work",
      needsConfirmation: false,
    };
  }

  return {
    title: message.slice(0, 72).trim() || "New work",
    summary: message.trim(),
    category: "General",
    workMode: "hybrid",
    plainRequirements: [
      "Clear scope before start",
      "Payment protected until you approve",
    ],
    deliverables: ["Text response"],
    budgetAmount: 5000,
    currency: "USD",
    riskHint: "Standard work",
    needsConfirmation: false,
  };
}

/** Deterministic planner for UI + tests. No live LLM. */
export class MockOrchestratorModel implements OrchestratorModel {
  async plan(input: OrchestratorInput): Promise<OrchestratorPlan> {
    const message = input.message.trim();
    if (message.length < 10) {
      return {
        kind: "ask_user",
        question: "Add a bit more detail — what needs to be done, and where?",
      };
    }

    const plan = inferPlan(message);
    return {
      kind: "work_draft",
      plan,
      explanation:
        "Daisy prepared a draft from your description. Edit anything before posting.",
    };
  }
}
