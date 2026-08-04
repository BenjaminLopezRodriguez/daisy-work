/** Runtime enums as const objects + derived string-union types. */

export const RiskLevel = {
  L1: "L1",
  L2: "L2",
  L3: "L3",
  L4: "L4",
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const WorkOrderStatus = {
  Draft: "draft",
  RequirementsPending: "requirements_pending",
  Ready: "ready",
  Published: "published",
  Assigned: "assigned",
  Active: "active",
  Submitted: "submitted",
  ChangesRequested: "changes_requested",
  UnderReview: "under_review",
  Approved: "approved",
  Disputed: "disputed",
  Cancelled: "cancelled",
  Paid: "paid",
} as const;
export type WorkOrderStatus =
  (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const CredentialStatus = {
  Unverified: "unverified",
  Pending: "pending",
  Verified: "verified",
  Expired: "expired",
  Rejected: "rejected",
} as const;
export type CredentialStatus =
  (typeof CredentialStatus)[keyof typeof CredentialStatus];

/** Alias used by some entity fields */
export type VerificationStatus = CredentialStatus;
export const VerificationStatus = CredentialStatus;

export const WorkMode = {
  Remote: "remote",
  OnSite: "on_site",
  Hybrid: "hybrid",
} as const;
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const AccountType = {
  Individual: "individual",
  Organization: "organization",
  Agent: "agent",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const IdentityStatus = {
  Unverified: "unverified",
  Pending: "pending",
  Verified: "verified",
} as const;
export type IdentityStatus =
  (typeof IdentityStatus)[keyof typeof IdentityStatus];

export const AssigneeType = {
  Human: "human",
  Agent: "agent",
  Unassigned: "unassigned",
} as const;
export type AssigneeType = (typeof AssigneeType)[keyof typeof AssigneeType];

export const BudgetType = {
  Fixed: "fixed",
  Hourly: "hourly",
  Milestone: "milestone",
} as const;
export type BudgetType = (typeof BudgetType)[keyof typeof BudgetType];

export const RequirementType = {
  License: "license",
  Identity: "identity",
  Insurance: "insurance",
  LocationAccess: "location_access",
  BackgroundCheck: "background_check",
  Nda: "nda",
  SafetyAcknowledgment: "safety_acknowledgment",
  Other: "other",
} as const;
export type RequirementType =
  (typeof RequirementType)[keyof typeof RequirementType];

export const RequirementStatus = {
  Pending: "pending",
  Satisfied: "satisfied",
  Waived: "waived",
  Failed: "failed",
} as const;
export type RequirementStatus =
  (typeof RequirementStatus)[keyof typeof RequirementStatus];

export const VerificationMethod = {
  Automatic: "automatic",
  DocumentReview: "document_review",
  Manual: "manual",
  AgentAssisted: "agent_assisted",
} as const;
export type VerificationMethod =
  (typeof VerificationMethod)[keyof typeof VerificationMethod];

export const DeliverableType = {
  Image: "image",
  Video: "video",
  Document: "document",
  Text: "text",
  Link: "link",
  StructuredData: "structured_data",
  PhysicalCompletion: "physical_completion",
  Signature: "signature",
} as const;
export type DeliverableType =
  (typeof DeliverableType)[keyof typeof DeliverableType];

export const SubmissionStatus = {
  Draft: "draft",
  Submitted: "submitted",
  ChangesRequested: "changes_requested",
  Approved: "approved",
  Rejected: "rejected",
} as const;
export type SubmissionStatus =
  (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const EvidenceVerificationStatus = {
  Unchecked: "unchecked",
  Passed: "passed",
  Flagged: "flagged",
  Failed: "failed",
} as const;
export type EvidenceVerificationStatus =
  (typeof EvidenceVerificationStatus)[keyof typeof EvidenceVerificationStatus];

export const ContractStatus = {
  Draft: "draft",
  PendingAcceptance: "pending_acceptance",
  Active: "active",
  Superseded: "superseded",
  Cancelled: "cancelled",
} as const;
export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus];

export const MilestoneStatus = {
  Pending: "pending",
  Active: "active",
  Submitted: "submitted",
  Approved: "approved",
  Paid: "paid",
  Cancelled: "cancelled",
} as const;
export type MilestoneStatus =
  (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const PaymentStatus = {
  Unauthorized: "unauthorized",
  Authorized: "authorized",
  Released: "released",
  Refunded: "refunded",
  Disputed: "disputed",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ActorType = {
  User: "user",
  Agent: "agent",
  System: "system",
  Organization: "organization",
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

export const CredentialType = {
  GovernmentIdentity: "government_identity",
  ContractorLicense: "contractor_license",
  ElectricianLicense: "electrician_license",
  ProfessionalCertification: "professional_certification",
  InsurancePolicy: "insurance_policy",
  BackgroundCheck: "background_check",
  Other: "other",
} as const;
export type CredentialType =
  (typeof CredentialType)[keyof typeof CredentialType];

export const Availability = {
  Available: "available",
  Limited: "limited",
  Unavailable: "unavailable",
} as const;
export type Availability = (typeof Availability)[keyof typeof Availability];
