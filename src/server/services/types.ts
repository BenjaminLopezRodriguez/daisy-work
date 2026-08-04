import { z } from "zod";
import type {
  GovernanceEvent,
  Requirement,
  RiskLevel,
  Submission,
  WorkOrder,
} from "@/domain";
import { RiskLevel as RiskLevelValues } from "@/domain";

export const assessWorkInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  workMode: z.enum(["remote", "on_site", "hybrid"]).optional(),
});
export type AssessWorkInput = z.infer<typeof assessWorkInputSchema>;

export type AssessWorkResult = {
  riskLevel: RiskLevel;
  explanation: string;
  isMocked: true;
  suggestedCategory: string;
};

export const determineRequirementsInputSchema = z.object({
  workOrderId: z.string().min(1),
  riskLevel: z.enum([
    RiskLevelValues.L1,
    RiskLevelValues.L2,
    RiskLevelValues.L3,
    RiskLevelValues.L4,
  ]),
  jurisdiction: z.string().optional(),
});
export type DetermineRequirementsInput = z.infer<
  typeof determineRequirementsInputSchema
>;

export type DetermineRequirementsResult = {
  requirements: Requirement[];
  events: GovernanceEvent[];
  isMocked: true;
};

export const evaluateSubmissionInputSchema = z.object({
  workOrderId: z.string().min(1),
  submissionId: z.string().min(1),
});
export type EvaluateSubmissionInput = z.infer<
  typeof evaluateSubmissionInputSchema
>;

export type EvaluateSubmissionResult = {
  recommendation: "approve" | "request_changes" | "escalate" | "reject";
  explanation: string;
  isMocked: true;
  events: GovernanceEvent[];
};

export type GovernanceService = {
  assessWork: (input: AssessWorkInput) => Promise<AssessWorkResult>;
  determineRequirements: (
    input: DetermineRequirementsInput,
  ) => Promise<DetermineRequirementsResult>;
  evaluateSubmission: (
    input: EvaluateSubmissionInput,
  ) => Promise<EvaluateSubmissionResult>;
};

export const submitCredentialInputSchema = z.object({
  workerProfileId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  issuingAuthority: z.string().min(1),
  jurisdiction: z.string().optional(),
  credentialNumber: z.string().optional(),
  documentUrl: z.string().optional(),
});
export type SubmitCredentialInput = z.infer<typeof submitCredentialInputSchema>;

export const evaluateCredentialInputSchema = z.object({
  credentialId: z.string().min(1),
});
export type EvaluateCredentialInput = z.infer<
  typeof evaluateCredentialInputSchema
>;

export type CredentialService = {
  submitCredential: (
    input: SubmitCredentialInput,
  ) => Promise<{ credentialId: string; isMocked: true }>;
  evaluateCredential: (
    input: EvaluateCredentialInput,
  ) => Promise<{
    status: "verified" | "pending" | "rejected" | "expired";
    explanation: string;
    isMocked: true;
  }>;
};

export const createDraftInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requesterId: z.string().min(1),
  category: z.string().min(1),
  workMode: z.enum(["remote", "on_site", "hybrid"]),
  budgetAmount: z.number().int().nonnegative(),
  currency: z.string().default("USD"),
});
export type CreateDraftInput = z.infer<typeof createDraftInputSchema>;

export const workOrderIdSchema = z.object({
  workOrderId: z.string().min(1),
});

export const assignInputSchema = workOrderIdSchema.extend({
  assigneeId: z.string().min(1),
  assigneeType: z.enum(["human", "agent"]),
});

export const submitWorkInputSchema = workOrderIdSchema.extend({
  submittedBy: z.string().min(1),
  notes: z.string().optional(),
});

export type WorkOrderService = {
  createDraft: (input: CreateDraftInput) => Promise<WorkOrder>;
  publish: (input: { workOrderId: string }) => Promise<WorkOrder>;
  assign: (input: z.infer<typeof assignInputSchema>) => Promise<WorkOrder>;
  submit: (
    input: z.infer<typeof submitWorkInputSchema>,
  ) => Promise<{ workOrder: WorkOrder; submission: Submission }>;
  approve: (input: { workOrderId: string }) => Promise<WorkOrder>;
  getById: (workOrderId: string) => Promise<WorkOrder | null>;
  listForUser: (userId: string) => Promise<WorkOrder[]>;
};

export type DaisyServices = {
  governance: GovernanceService;
  credentials: CredentialService;
  workOrders: WorkOrderService;
};
