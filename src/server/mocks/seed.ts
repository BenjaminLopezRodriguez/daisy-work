import {
  AccountType,
  ActorType,
  AssigneeType,
  Availability,
  BudgetType,
  CredentialStatus,
  CredentialType,
  DeliverableType,
  EvidenceVerificationStatus,
  IdentityStatus,
  PaymentStatus,
  RequirementStatus,
  RequirementType,
  RiskLevel,
  SubmissionStatus,
  VerificationMethod,
  WorkMode,
  WorkOrderStatus,
  type AttentionItem,
  type Credential,
  type Deliverable,
  type Evidence,
  type GovernanceEvent,
  type Organization,
  type Payment,
  type Requirement,
  type Submission,
  type User,
  type WorkerProfile,
  type WorkOrder,
} from "@/domain";

/** Stable clock for seed data (avoids SSR/client hydration drift). */
const SEED_NOW = new Date("2026-08-01T12:00:00.000Z");

const daysAgo = (n: number) => {
  const d = new Date(SEED_NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

const daysFromNow = (n: number) => {
  const d = new Date(SEED_NOW);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

export const MAYA_USER_ID = "user_maya";
export const STOREFRONT_WO_ID = "wo_storefront_photo";
export const ELECTRICAL_WO_ID = "wo_electrical_panel";
export const MAYA_WORKER_PROFILE_ID = "wp_maya";
export const CURRENT_USER_ID = MAYA_USER_ID;

export const seedUsers: User[] = [
  {
    id: MAYA_USER_ID,
    name: "Maya Chen",
    email: "maya@daisy.work",
    avatar: null,
    accountType: AccountType.Individual,
    identityStatus: IdentityStatus.Verified,
    trustLevel: 82,
    createdAt: daysAgo(120),
  },
  {
    id: "user_jordan",
    name: "Jordan Ellis",
    email: "jordan@northline.co",
    avatar: null,
    accountType: AccountType.Individual,
    identityStatus: IdentityStatus.Verified,
    trustLevel: 74,
    createdAt: daysAgo(200),
  },
  {
    id: "user_agent_daisy",
    name: "Daisy Governance Agent",
    email: "agent@daisy.work",
    avatar: null,
    accountType: AccountType.Agent,
    identityStatus: IdentityStatus.Verified,
    trustLevel: 90,
    createdAt: daysAgo(365),
  },
];

export const seedOrganizations: Organization[] = [
  {
    id: "org_northline",
    name: "Northline Retail",
    slug: "northline",
    logo: null,
    verificationStatus: IdentityStatus.Verified,
    billingStatus: "active",
    createdAt: daysAgo(400),
  },
];

export const seedWorkerProfiles: WorkerProfile[] = [
  {
    id: MAYA_WORKER_PROFILE_ID,
    userId: MAYA_USER_ID,
    headline: "Field verification & licensed electrical support",
    biography:
      "Dual-mode worker: quick digital verification jobs and regulated on-site electrical assistance under proper licensing.",
    skills: ["Photo verification", "Field inspection", "Electrical assist"],
    serviceAreas: ["Seattle, WA", "Bellevue, WA"],
    workModes: [WorkMode.Remote, WorkMode.OnSite],
    hourlyRate: 8500,
    availability: Availability.Available,
    verificationStatus: IdentityStatus.Verified,
    rating: 4.9,
    completedJobs: 47,
  },
];

export const seedCredentials: Credential[] = [
  {
    id: "cred_maya_id",
    workerProfileId: MAYA_WORKER_PROFILE_ID,
    type: CredentialType.GovernmentIdentity,
    title: "Government-issued ID",
    issuingAuthority: "Washington DOL",
    jurisdiction: "WA",
    credentialNumber: "WA-****-4421",
    issuedAt: daysAgo(800),
    expiresAt: daysFromNow(400),
    verificationStatus: CredentialStatus.Verified,
    documentUrl: null,
    isMocked: true,
  },
  {
    id: "cred_maya_electric",
    workerProfileId: MAYA_WORKER_PROFILE_ID,
    type: CredentialType.ElectricianLicense,
    title: "Journeyman Electrician License",
    issuingAuthority: "Washington L&I",
    jurisdiction: "WA",
    credentialNumber: "EL-****-1189",
    issuedAt: daysAgo(600),
    expiresAt: daysFromNow(200),
    verificationStatus: CredentialStatus.Verified,
    documentUrl: null,
    isMocked: true,
  },
  {
    id: "cred_maya_insurance",
    workerProfileId: MAYA_WORKER_PROFILE_ID,
    type: CredentialType.InsurancePolicy,
    title: "General Liability Insurance",
    issuingAuthority: "Harbor Mutual",
    jurisdiction: "WA",
    credentialNumber: "GL-****-9022",
    issuedAt: daysAgo(90),
    expiresAt: daysFromNow(275),
    verificationStatus: CredentialStatus.Pending,
    documentUrl: null,
    isMocked: true,
  },
  {
    id: "cred_maya_bg",
    workerProfileId: MAYA_WORKER_PROFILE_ID,
    type: CredentialType.BackgroundCheck,
    title: "Background check",
    issuingAuthority: "MockCheck",
    jurisdiction: null,
    credentialNumber: null,
    issuedAt: daysAgo(400),
    expiresAt: daysAgo(10),
    verificationStatus: CredentialStatus.Expired,
    documentUrl: null,
    isMocked: true,
  },
];

export const seedWorkOrders: WorkOrder[] = [
  {
    id: STOREFRONT_WO_ID,
    title: "Photograph Northline storefront",
    description:
      "Capture a clear daytime photo of the storefront entrance and signage. Confirm whether the location appears open for business.",
    requesterId: "user_jordan",
    organizationId: "org_northline",
    assigneeType: AssigneeType.Human,
    assigneeId: MAYA_USER_ID,
    category: "Photo verification",
    workMode: WorkMode.OnSite,
    location: {
      label: "1421 Pine St",
      city: "Seattle",
      region: "WA",
      country: "US",
      lat: 47.6139,
      lng: -122.328,
    },
    riskLevel: RiskLevel.L1,
    status: WorkOrderStatus.Submitted,
    budgetType: BudgetType.Fixed,
    budgetAmount: 2500,
    currency: "USD",
    startsAt: daysAgo(1),
    dueAt: daysFromNow(1),
    createdAt: daysAgo(3),
  },
  {
    id: ELECTRICAL_WO_ID,
    title: "Residential electrical panel inspection",
    description:
      "Inspect a residential electrical panel, document condition, and note any safety concerns. Licensed electrician required for jurisdiction WA.",
    requesterId: MAYA_USER_ID,
    organizationId: null,
    assigneeType: AssigneeType.Unassigned,
    assigneeId: null,
    category: "Electrical",
    workMode: WorkMode.OnSite,
    location: {
      label: "88 Cedar Ave",
      city: "Bellevue",
      region: "WA",
      country: "US",
      lat: 47.6101,
      lng: -122.2015,
    },
    riskLevel: RiskLevel.L4,
    status: WorkOrderStatus.RequirementsPending,
    budgetType: BudgetType.Fixed,
    budgetAmount: 45000,
    currency: "USD",
    startsAt: daysFromNow(5),
    dueAt: daysFromNow(12),
    createdAt: daysAgo(1),
  },
  {
    id: "wo_label_batch",
    title: "Label product shelf images",
    description:
      "Review 40 shelf photos and tag whether price labels are visible and readable.",
    requesterId: "user_jordan",
    organizationId: "org_northline",
    assigneeType: AssigneeType.Human,
    assigneeId: MAYA_USER_ID,
    category: "Data labeling",
    workMode: WorkMode.Remote,
    location: null,
    riskLevel: RiskLevel.L1,
    status: WorkOrderStatus.Active,
    budgetType: BudgetType.Fixed,
    budgetAmount: 6000,
    currency: "USD",
    startsAt: daysAgo(2),
    dueAt: daysFromNow(3),
    createdAt: daysAgo(4),
  },
];

export const seedRequirements: Requirement[] = [
  {
    id: "req_sf_identity",
    workOrderId: STOREFRONT_WO_ID,
    type: RequirementType.Identity,
    label: "Basic identity",
    description: "Worker identity on file with Daisy.",
    required: true,
    verificationMethod: VerificationMethod.Automatic,
    status: RequirementStatus.Satisfied,
  },
  {
    id: "req_el_license",
    workOrderId: ELECTRICAL_WO_ID,
    type: RequirementType.License,
    label: "Electrician license (WA)",
    description:
      "Valid electrician license for the work jurisdiction. Mocked check only in this slice.",
    required: true,
    verificationMethod: VerificationMethod.DocumentReview,
    status: RequirementStatus.Pending,
  },
  {
    id: "req_el_insurance",
    workOrderId: ELECTRICAL_WO_ID,
    type: RequirementType.Insurance,
    label: "Liability insurance",
    description: "Active general liability coverage appropriate for the work.",
    required: true,
    verificationMethod: VerificationMethod.DocumentReview,
    status: RequirementStatus.Pending,
  },
  {
    id: "req_el_safety",
    workOrderId: ELECTRICAL_WO_ID,
    type: RequirementType.SafetyAcknowledgment,
    label: "Safety acknowledgment",
    description: "Worker acknowledges electrical safety protocol.",
    required: true,
    verificationMethod: VerificationMethod.Manual,
    status: RequirementStatus.Pending,
  },
  {
    id: "req_el_contract",
    workOrderId: ELECTRICAL_WO_ID,
    type: RequirementType.Other,
    label: "Signed regulated service agreement",
    description: "Requester and worker accept the L4 contract terms.",
    required: true,
    verificationMethod: VerificationMethod.Manual,
    status: RequirementStatus.Pending,
  },
];

export const seedDeliverables: Deliverable[] = [
  {
    id: "del_sf_photo",
    workOrderId: STOREFRONT_WO_ID,
    type: DeliverableType.Image,
    title: "Storefront photo",
    description: "Daytime photo of entrance and signage.",
    required: true,
    validationRules: ["min_resolution_1080p", "exif_timestamp_present"],
  },
  {
    id: "del_sf_open",
    workOrderId: STOREFRONT_WO_ID,
    type: DeliverableType.StructuredData,
    title: "Open status",
    description: "Confirm whether the storefront appears open.",
    required: true,
    validationRules: ["enum:open|closed|unclear"],
  },
  {
    id: "del_el_photos",
    workOrderId: ELECTRICAL_WO_ID,
    type: DeliverableType.Image,
    title: "Panel condition photos",
    description: "Before photos of the panel cover open and closed.",
    required: true,
    validationRules: ["min_count:2"],
  },
  {
    id: "del_el_report",
    workOrderId: ELECTRICAL_WO_ID,
    type: DeliverableType.Document,
    title: "Inspection notes",
    description: "Written findings and safety observations.",
    required: true,
    validationRules: ["min_words:80"],
  },
];

export const seedSubmissions: Submission[] = [
  {
    id: "sub_sf_1",
    workOrderId: STOREFRONT_WO_ID,
    submittedBy: MAYA_USER_ID,
    status: SubmissionStatus.Submitted,
    notes: "Entrance visible; lights on; door unlocked appearance.",
    submittedAt: daysAgo(0),
  },
];

export const seedEvidence: Evidence[] = [
  {
    id: "ev_sf_1",
    submissionId: "sub_sf_1",
    type: DeliverableType.Image,
    fileUrl: "/placeholders/storefront.jpg",
    metadata: { width: "1920", height: "1080", openStatus: "open" },
    capturedAt: daysAgo(0),
    location: {
      label: "1421 Pine St",
      city: "Seattle",
      region: "WA",
      country: "US",
      lat: 47.6139,
      lng: -122.328,
    },
    verificationStatus: EvidenceVerificationStatus.Passed,
    isMocked: true,
  },
];

export const seedGovernanceEvents: GovernanceEvent[] = [
  {
    id: "gov_sf_assess",
    workOrderId: STOREFRONT_WO_ID,
    actorType: ActorType.Agent,
    actorId: "user_agent_daisy",
    eventType: "risk_assessed",
    explanation:
      "Classified as L1 simple digital/field photo task: fixed price, basic identity, automatic validation where possible.",
    metadata: { riskLevel: RiskLevel.L1 },
    createdAt: daysAgo(3),
    isMocked: true,
  },
  {
    id: "gov_el_assess",
    workOrderId: ELECTRICAL_WO_ID,
    actorType: ActorType.Agent,
    actorId: "user_agent_daisy",
    eventType: "risk_assessed",
    explanation:
      "Classified as L4 regulated physical work. License, insurance, signed contract, and human review before payout recommended. Not a legal determination.",
    metadata: { riskLevel: RiskLevel.L4, jurisdiction: "WA" },
    createdAt: daysAgo(1),
    isMocked: true,
  },
  {
    id: "gov_el_reqs",
    workOrderId: ELECTRICAL_WO_ID,
    actorType: ActorType.Agent,
    actorId: "user_agent_daisy",
    eventType: "requirements_determined",
    explanation:
      "Added electrician license, liability insurance, safety acknowledgment, and regulated service agreement.",
    metadata: { requirementCount: "4" },
    createdAt: daysAgo(1),
    isMocked: true,
  },
];

export const seedPayments: Payment[] = [
  {
    id: "pay_sf_1",
    workOrderId: STOREFRONT_WO_ID,
    milestoneId: null,
    amount: 2500,
    currency: "USD",
    status: PaymentStatus.Authorized,
    authorizedAt: daysAgo(2),
    releasedAt: null,
  },
  {
    id: "pay_sf_2",
    workOrderId: STOREFRONT_WO_ID,
    milestoneId: null,
    amount: 12500,
    currency: "USD",
    status: PaymentStatus.Released,
    authorizedAt: daysAgo(10),
    releasedAt: daysAgo(8),
  },
  {
    id: "pay_el_1",
    workOrderId: ELECTRICAL_WO_ID,
    milestoneId: null,
    amount: 45000,
    currency: "USD",
    status: PaymentStatus.Unauthorized,
    authorizedAt: null,
    releasedAt: null,
  },
];

export const seedAttention: AttentionItem[] = [
  {
    id: "att_review_sf",
    kind: "review",
    title: "Review storefront submission",
    description: "Maya submitted photo evidence for Northline storefront.",
    workOrderId: STOREFRONT_WO_ID,
    priority: "high",
    createdAt: daysAgo(0),
  },
  {
    id: "att_cred_insurance",
    kind: "credential",
    title: "Insurance pending review",
    description: "Maya's liability insurance document awaits mocked evaluation.",
    workOrderId: null,
    priority: "medium",
    createdAt: daysAgo(1),
  },
  {
    id: "att_el_reqs",
    kind: "requirement",
    title: "Electrical job missing requirements",
    description: "L4 panel inspection still needs license and contract steps.",
    workOrderId: ELECTRICAL_WO_ID,
    priority: "high",
    createdAt: daysAgo(1),
  },
];

/** Aliases for alternate import names */
export const users = seedUsers;
export const organizations = seedOrganizations;
export const workerProfiles = seedWorkerProfiles;
export const credentials = seedCredentials;
export const workOrders = seedWorkOrders;
export const requirements = seedRequirements;
export const deliverables = seedDeliverables;
export const submissions = seedSubmissions;
export const evidence = seedEvidence;
export const governanceEvents = seedGovernanceEvents;
export const payments = seedPayments;
export const attentionQueue = seedAttention;

export function getUser(id: string) {
  return seedUsers.find((u) => u.id === id);
}
