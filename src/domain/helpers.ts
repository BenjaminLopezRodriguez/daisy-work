import {
  CredentialStatus,
  RiskLevel,
  WorkOrderStatus,
  type RiskLevel as RiskLevelT,
  type WorkOrderStatus as WorkOrderStatusT,
  type CredentialStatus as CredentialStatusT,
} from "./enums";
import type { MoneyMinor } from "./entities";

const RISK_LABELS: Record<RiskLevelT, string> = {
  [RiskLevel.L1]: "Level 1 — Simple digital task",
  [RiskLevel.L2]: "Level 2 — Skilled remote work",
  [RiskLevel.L3]: "Level 3 — Physical service",
  [RiskLevel.L4]: "Level 4 — Regulated or high-risk",
};

const RISK_SHORT: Record<RiskLevelT, string> = {
  [RiskLevel.L1]: "L1",
  [RiskLevel.L2]: "L2",
  [RiskLevel.L3]: "L3",
  [RiskLevel.L4]: "L4",
};

const STATUS_LABELS: Record<WorkOrderStatusT, string> = {
  [WorkOrderStatus.Draft]: "Draft",
  [WorkOrderStatus.RequirementsPending]: "Requirements pending",
  [WorkOrderStatus.Ready]: "Ready",
  [WorkOrderStatus.Published]: "Published",
  [WorkOrderStatus.Assigned]: "Assigned",
  [WorkOrderStatus.Active]: "Active",
  [WorkOrderStatus.Submitted]: "Submitted",
  [WorkOrderStatus.ChangesRequested]: "Changes requested",
  [WorkOrderStatus.UnderReview]: "Under review",
  [WorkOrderStatus.Approved]: "Approved",
  [WorkOrderStatus.Disputed]: "Disputed",
  [WorkOrderStatus.Cancelled]: "Cancelled",
  [WorkOrderStatus.Paid]: "Paid",
};

export function riskLevelLabel(level: RiskLevelT): string {
  return RISK_LABELS[level];
}

export function riskLevelShort(level: RiskLevelT): string {
  return RISK_SHORT[level];
}

export function workOrderStatusLabel(status: WorkOrderStatusT): string {
  return STATUS_LABELS[status];
}

export function formatMoney(
  amount: MoneyMinor,
  currency = "USD",
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export function credentialStatusLabel(status: CredentialStatusT): string {
  switch (status) {
    case CredentialStatus.Unverified:
      return "Unverified";
    case CredentialStatus.Pending:
      return "Pending review";
    case CredentialStatus.Verified:
      return "Verified";
    case CredentialStatus.Expired:
      return "Expired";
    case CredentialStatus.Rejected:
      return "Rejected";
    default:
      return status;
  }
}

export const MOCKED_VERIFICATION_COPY =
  "Mocked — not real verification" as const;

export const PLATFORM_FEE_BPS = 1000;

export function platformFee(amount: MoneyMinor): MoneyMinor {
  return Math.round((amount * PLATFORM_FEE_BPS) / 10_000);
}

export function workerPayout(amount: MoneyMinor): MoneyMinor {
  return amount - platformFee(amount);
}

export function formatDateTime(
  value: Date | string | null,
  locale = "en-US",
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
