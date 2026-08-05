import "server-only";

import { env } from "@/env";
import type {
  OrchestratorInput,
  OrchestratorModel,
  OrchestratorPlan,
} from "../orchestrator.types";
import { workPlanSchema } from "../orchestrator.types";
import { MockOrchestratorModel } from "./mock-orchestrator-model";

const SYSTEM = `You are Daisy, a calm work marketplace assistant (Upwork-like).
Given a user's plain description of work they need done, return ONLY valid JSON with this shape:
{
  "kind": "work_draft" | "ask_user",
  "question": "string (only if ask_user)",
  "explanation": "string (only if work_draft)",
  "plan": {
    "title": "string",
    "summary": "string",
    "category": "string",
    "workMode": "remote" | "on_site" | "hybrid",
    "plainRequirements": ["string"],
    "deliverables": ["string"],
    "budgetAmount": number, // USD cents integer
    "currency": "USD",
    "riskHint": "string",
    "needsConfirmation": boolean
  }
}
Rules:
- ALWAYS return work_draft. Never ask the user for more information: they came
  here to get the request out, not to fill in a form. Missing details are left
  out or given a sensible placeholder the user can edit.
- Set needsConfirmation true when you had to assume something important, so the
  UI can point at the field. Do not turn that into a question.
- Keep copy plain and client-facing. No governance jargon.
- budgetAmount is integer cents (e.g. $250 = 25000).`;

export class DeepSeekOrchestratorModel implements OrchestratorModel {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async plan(input: OrchestratorInput): Promise<OrchestratorPlan> {
    const message = input.message.trim();
    // Very short asks still get a draft. The user edits it; we don't interrogate.
    if (message.length < 10) return new MockOrchestratorModel().plan(input);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: message },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("DeepSeek error", res.status, text);
        return new MockOrchestratorModel().plan(input);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return new MockOrchestratorModel().plan(input);

      const parsed = JSON.parse(content) as {
        kind?: string;
        question?: string;
        explanation?: string;
        plan?: unknown;
      };

      // The model was told never to ask. If it does anyway, draft from the
      // message instead of bouncing the question back to the user.
      if (parsed.kind === "ask_user" || !parsed.plan) {
        return new MockOrchestratorModel().plan(input);
      }

      const plan = workPlanSchema.parse(parsed.plan);
      return {
        kind: "work_draft",
        plan,
        explanation:
          parsed.explanation ??
          "Daisy prepared a draft from your description. Edit anything before posting.",
      };
    } catch (err) {
      console.error("DeepSeek plan failed", err);
      return new MockOrchestratorModel().plan(input);
    }
  }
}

export function createOrchestratorModel(): OrchestratorModel {
  const key = env.DEEPSEEK_API_KEY?.trim();
  if (!key) return new MockOrchestratorModel();
  return new DeepSeekOrchestratorModel(
    key,
    env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    env.DEEPSEEK_MODEL ?? "deepseek-chat",
  );
}
