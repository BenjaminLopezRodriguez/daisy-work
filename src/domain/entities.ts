import type {
  AccountType,
  ActorType,
  AssigneeType,
  Availability,
  BudgetType,
  ContractStatus,
  CredentialStatus,
  CredentialType,
  DeliverableType,
  EvidenceVerificationStatus,
  IdentityStatus,
  MilestoneStatus,
  PaymentStatus,
  RequirementStatus,
  RequirementType,
  RiskLevel,
  SubmissionStatus,
  VerificationMethod,
  WorkMode,
  WorkOrderStatus,
} from "./enums";

/** Money stored as integer minor units (e.g. cents). */
export type MoneyMinor = number;

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  accountType: AccountType;
  identityStatus: IdentityStatus;
  trustLevel: number;
  createdAt: Date;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  verificationStatus: IdentityStatus;
  billingStatus: "active" | "past_due" | "none";
  createdAt: Date;
};

export type WorkerProfile = {
  id: string;
  userId: string;
  headline: string;
  biography: string;
  skills: string[];
  serviceAreas: string[];
  workModes: WorkMode[];
  hourlyRate: MoneyMinor | null;
  availability: Availability;
  verificationStatus: IdentityStatus;
  rating: number | null;
  completedJobs: number;
};

export type Credential = {
  id: string;
  workerProfileId: string;
  type: CredentialType;
  title: string;
  issuingAuthority: string;
  jurisdiction: string | null;
  credentialNumber: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  verificationStatus: CredentialStatus;
  documentUrl: string | null;
  isMocked: boolean;
};

export type WorkOrderLocation = {
  label: string;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

export type WorkOrder = {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  organizationId: string | null;
  assigneeType: AssigneeType;
  assigneeId: string | null;
  category: string;
  workMode: WorkMode;
  location: WorkOrderLocation | null;
  riskLevel: RiskLevel;
  status: WorkOrderStatus;
  budgetType: BudgetType;
  budgetAmount: MoneyMinor;
  currency: string;
  startsAt: Date | null;
  dueAt: Date | null;
  createdAt: Date;
};

export type Requirement = {
  id: string;
  workOrderId: string;
  type: RequirementType;
  label: string;
  description: string;
  required: boolean;
  verificationMethod: VerificationMethod;
  status: RequirementStatus;
};

export type Deliverable = {
  id: string;
  workOrderId: string;
  type: DeliverableType;
  title: string;
  description: string;
  required: boolean;
  validationRules: string[];
};

export type Submission = {
  id: string;
  workOrderId: string;
  submittedBy: string;
  status: SubmissionStatus;
  notes: string | null;
  submittedAt: Date | null;
};

export type Evidence = {
  id: string;
  submissionId: string;
  type: DeliverableType;
  fileUrl: string | null;
  metadata: Record<string, string>;
  capturedAt: Date | null;
  location: WorkOrderLocation | null;
  verificationStatus: EvidenceVerificationStatus;
  isMocked: boolean;
};

export type Contract = {
  id: string;
  workOrderId: string;
  version: number;
  contractType: "platform_standard" | "service_agreement" | "regulated";
  terms: string;
  acceptedByRequesterAt: Date | null;
  acceptedByWorkerAt: Date | null;
  status: ContractStatus;
};

export type Milestone = {
  id: string;
  workOrderId: string;
  title: string;
  description: string;
  amount: MoneyMinor;
  dueAt: Date | null;
  status: MilestoneStatus;
  approvalMethod: VerificationMethod;
};

export type Payment = {
  id: string;
  workOrderId: string;
  milestoneId: string | null;
  amount: MoneyMinor;
  currency: string;
  status: PaymentStatus;
  authorizedAt: Date | null;
  releasedAt: Date | null;
};

export type Review = {
  id: string;
  workOrderId: string;
  reviewerId: string;
  subjectId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export type GovernanceEvent = {
  id: string;
  workOrderId: string;
  actorType: ActorType;
  actorId: string;
  eventType: string;
  explanation: string;
  metadata: Record<string, string>;
  createdAt: Date;
  isMocked: boolean;
};

export type AttentionItem = {
  id: string;
  kind: "review" | "credential" | "requirement" | "dispute" | "deadline";
  title: string;
  description: string;
  workOrderId: string | null;
  priority: "low" | "medium" | "high";
  createdAt: Date;
};
