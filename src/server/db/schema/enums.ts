import { pgEnum } from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", [
  "individual",
  "organization",
  "agent",
]);

export const identityStatusEnum = pgEnum("identity_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "pending",
  "verified",
  "expired",
  "rejected",
]);

export const workModeEnum = pgEnum("work_mode", [
  "remote",
  "local",
  "on_site",
  "hybrid",
]);

export const riskLevelEnum = pgEnum("risk_level", [
  "level_1",
  "level_2",
  "level_3",
  "level_4",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "draft",
  "requirements_pending",
  "ready",
  "published",
  "assigned",
  "active",
  "submitted",
  "changes_requested",
  "under_review",
  "approved",
  "disputed",
  "cancelled",
  "paid",
]);

export const assigneeTypeEnum = pgEnum("assignee_type", [
  "human",
  "agent",
  "unassigned",
]);

export const budgetTypeEnum = pgEnum("budget_type", [
  "fixed",
  "hourly",
  "per_item",
  "milestone",
]);

export const credentialTypeEnum = pgEnum("credential_type", [
  "government_identity",
  "contractor_license",
  "electrician_license",
  "professional_certification",
  "insurance_policy",
  "background_check",
]);

export const requirementTypeEnum = pgEnum("requirement_type", [
  "identity_verification",
  "skill",
  "license",
  "insurance",
  "background_check",
  "geographic_eligibility",
  "equipment",
  "availability",
  "nda",
  "safety_acknowledgment",
  "location_access",
]);

export const deliverableTypeEnum = pgEnum("deliverable_type", [
  "image",
  "video",
  "document",
  "text",
  "link",
  "structured_data",
  "physical_completion",
  "signature",
  "before_after",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "draft",
  "submitted",
  "approved",
  "changes_requested",
  "escalated",
  "disputed",
]);

export const actorTypeEnum = pgEnum("actor_type", [
  "human",
  "agent",
  "system",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "pending",
  "active",
  "submitted",
  "approved",
  "paid",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "released",
  "failed",
  "refunded",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "pending_acceptance",
  "active",
  "completed",
  "cancelled",
]);

export const billingStatusEnum = pgEnum("billing_status", [
  "active",
  "past_due",
  "cancelled",
]);
