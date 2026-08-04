import {
  ActorType,
  RequirementStatus,
  RequirementType,
  RiskLevel,
  VerificationMethod,
  type GovernanceEvent,
  type Requirement,
} from "@/domain";
import type {
  AssessWorkInput,
  AssessWorkResult,
  GovernanceService,
} from "./types";
import {
  assessWorkInputSchema,
  determineRequirementsInputSchema,
  evaluateSubmissionInputSchema,
} from "./types";
import { seedGovernanceEvents, seedRequirements } from "../mocks/seed";

function classifyRisk(input: AssessWorkInput): AssessWorkResult {
  const text =
    `${input.title} ${input.description} ${input.category ?? ""}`.toLowerCase();

  if (/electric|plumb|licens|regulated|panel|contractor|insurance/.test(text)) {
    return {
      riskLevel: RiskLevel.L4,
      explanation:
        "Mock assessment: language suggests regulated or high-risk physical work. Recommend license, insurance, contract, and human review before payout. Not a legal determination.",
      isMocked: true,
      suggestedCategory: input.category ?? "Regulated trades",
    };
  }

  if (
    /clean|deliver|install|inspect|field|on[- ]site|property/.test(text) ||
    input.workMode === "on_site"
  ) {
    return {
      riskLevel: RiskLevel.L3,
      explanation:
        "Mock assessment: physical/on-site service signals. Recommend identity, location, evidence capture, and structured completion checks.",
      isMocked: true,
      suggestedCategory: input.category ?? "Physical service",
    };
  }

  if (/design|program|code|research|bookkeep|write|edit/.test(text)) {
    return {
      riskLevel: RiskLevel.L2,
      explanation:
        "Mock assessment: skilled remote work. Recommend profile skills, milestones, deliverable review, and dispute path.",
      isMocked: true,
      suggestedCategory: input.category ?? "Skilled remote",
    };
  }

  return {
    riskLevel: RiskLevel.L1,
    explanation:
      "Mock assessment: simple digital/lightweight task. Basic identity, clear deliverable, fixed price, and fast payout path.",
    isMocked: true,
    suggestedCategory: input.category ?? "Simple digital",
  };
}

function requirementsForRisk(
  workOrderId: string,
  riskLevel: RiskLevel,
  jurisdiction?: string,
): Requirement[] {
  const base: Requirement[] = [
    {
      id: `req_${workOrderId}_identity`,
      workOrderId,
      type: RequirementType.Identity,
      label: "Basic identity",
      description: "Worker identity on file with Daisy.",
      required: true,
      verificationMethod: VerificationMethod.Automatic,
      status: RequirementStatus.Pending,
    },
  ];

  if (riskLevel === RiskLevel.L1) return base;

  if (riskLevel === RiskLevel.L2) {
    return [
      ...base,
      {
        id: `req_${workOrderId}_skills`,
        workOrderId,
        type: RequirementType.Other,
        label: "Relevant skills on profile",
        description: "Worker profile lists skills matching the work.",
        required: true,
        verificationMethod: VerificationMethod.Automatic,
        status: RequirementStatus.Pending,
      },
    ];
  }

  if (riskLevel === RiskLevel.L3) {
    return [
      ...base,
      {
        id: `req_${workOrderId}_location`,
        workOrderId,
        type: RequirementType.LocationAccess,
        label: "Location and scheduling",
        description: "Confirm site access and schedule window.",
        required: true,
        verificationMethod: VerificationMethod.Manual,
        status: RequirementStatus.Pending,
      },
      {
        id: `req_${workOrderId}_safety`,
        workOrderId,
        type: RequirementType.SafetyAcknowledgment,
        label: "Safety acknowledgment",
        description: "Worker acknowledges site safety requirements.",
        required: true,
        verificationMethod: VerificationMethod.Manual,
        status: RequirementStatus.Pending,
      },
    ];
  }

  return [
    ...base,
    {
      id: `req_${workOrderId}_license`,
      workOrderId,
      type: RequirementType.License,
      label: `License required${jurisdiction ? ` (${jurisdiction})` : ""}`,
      description:
        "Appropriate trade license for the jurisdiction. Mocked — not real verification.",
      required: true,
      verificationMethod: VerificationMethod.DocumentReview,
      status: RequirementStatus.Pending,
    },
    {
      id: `req_${workOrderId}_insurance`,
      workOrderId,
      type: RequirementType.Insurance,
      label: "Insurance verification",
      description: "Active liability coverage. Mocked — not real verification.",
      required: true,
      verificationMethod: VerificationMethod.DocumentReview,
      status: RequirementStatus.Pending,
    },
    {
      id: `req_${workOrderId}_contract`,
      workOrderId,
      type: RequirementType.Other,
      label: "Signed contract",
      description: "Requester and worker accept regulated service terms.",
      required: true,
      verificationMethod: VerificationMethod.Manual,
      status: RequirementStatus.Pending,
    },
  ];
}

export function createMockGovernanceService(): GovernanceService {
  return {
    async assessWork(raw) {
      const input = assessWorkInputSchema.parse(raw);
      return classifyRisk(input);
    },

    async determineRequirements(raw) {
      const input = determineRequirementsInputSchema.parse(raw);
      const existing = seedRequirements.filter(
        (r) => r.workOrderId === input.workOrderId,
      );
      const requirements =
        existing.length > 0
          ? existing
          : requirementsForRisk(
              input.workOrderId,
              input.riskLevel,
              input.jurisdiction,
            );

      const event: GovernanceEvent = {
        id: `gov_${input.workOrderId}_reqs_${Date.now()}`,
        workOrderId: input.workOrderId,
        actorType: ActorType.Agent,
        actorId: "user_agent_daisy",
        eventType: "requirements_determined",
        explanation: `Mocked requirement set for ${input.riskLevel}. Agents assist; they do not issue legal determinations.`,
        metadata: {
          riskLevel: input.riskLevel,
          count: String(requirements.length),
        },
        createdAt: new Date(),
        isMocked: true,
      };

      return { requirements, events: [event], isMocked: true };
    },

    async evaluateSubmission(raw) {
      const input = evaluateSubmissionInputSchema.parse(raw);
      const prior = seedGovernanceEvents.filter(
        (e) => e.workOrderId === input.workOrderId,
      );

      const event: GovernanceEvent = {
        id: `gov_${input.submissionId}_eval`,
        workOrderId: input.workOrderId,
        actorType: ActorType.Agent,
        actorId: "user_agent_daisy",
        eventType: "submission_evaluated",
        explanation:
          "Mocked evaluation: evidence appears complete for demo purposes. Recommend requester approval.",
        metadata: { submissionId: input.submissionId },
        createdAt: new Date(),
        isMocked: true,
      };

      return {
        recommendation: "approve",
        explanation: event.explanation,
        isMocked: true,
        events: [...prior, event],
      };
    },
  };
}
