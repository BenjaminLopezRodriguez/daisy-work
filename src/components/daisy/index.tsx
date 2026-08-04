import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Clock,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  MOCKED_VERIFICATION_COPY,
  riskLevelShort,
  workOrderStatusLabel,
  type RiskLevel,
  type WorkOrder,
  type WorkOrderStatus,
  type Credential,
  type Requirement,
  type Deliverable,
  type GovernanceEvent,
  type AttentionItem,
  type WorkerProfile,
  type Payment,
  type Evidence,
  credentialStatusLabel,
} from "@/domain";
import { cn } from "@/lib/utils";

export {
  ActionCluster,
  ActionStatusBanner,
  DisabledReason,
  FormField,
  StepProgress,
  type ActionStatus,
} from "./ux";

export {
  AppPage,
  PageHeader,
  PageSection,
  SectionHeader,
  ContentGrid,
  DetailRail,
  MobileStickyActions,
  StatCard,
  WorkCardGrid,
} from "./layout/primitives";

export { MotionPage, MotionSurface, MotionList } from "./motion";

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="surface-enter flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-8 shadow-sm">
      {Icon ? (
        <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const tone =
    level === "L4"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : level === "L3"
        ? "border-accent/50 bg-accent/30 text-accent-foreground"
        : level === "L2"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {riskLevelShort(level)}
    </span>
  );
}

export function WorkStatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {workOrderStatusLabel(status)}
    </Badge>
  );
}

export function VerificationBadge({
  isMocked = true,
  label,
}: {
  isMocked?: boolean;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/60 bg-accent/25 px-2 py-0.5 text-xs text-accent-foreground">
      <span className="size-1.5 rounded-full bg-accent-foreground/70" />
      {label ?? (isMocked ? MOCKED_VERIFICATION_COPY : "Verified")}
    </span>
  );
}

export function WorkOrderCard({
  workOrder,
  href,
  counterparty,
}: {
  workOrder: WorkOrder;
  href?: string;
  counterparty?: string;
}) {
  const content = (
    <article className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors duration-150 group-hover:border-primary/40 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <RiskLevelBadge level={workOrder.riskLevel} />
        <WorkStatusBadge status={workOrder.status} />
        <span className="truncate text-xs text-muted-foreground">
          {workOrder.category}
        </span>
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className="text-base font-semibold tracking-tight break-words group-hover:text-primary">
          {workOrder.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
          {workOrder.description}
        </p>
        {href ? (
          <span className="text-xs font-medium text-primary">View details</span>
        ) : null}
      </div>
      <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs sm:text-sm">
        <div className="min-w-0">
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="font-medium tabular-nums">
            {formatMoney(workOrder.budgetAmount, workOrder.currency)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Due</dt>
          <dd className="font-medium tabular-nums">
            {workOrder.dueAt ? workOrder.dueAt.toLocaleDateString() : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Mode</dt>
          <dd className="font-medium capitalize">
            {workOrder.workMode.replaceAll("_", " ")}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">
            {counterparty ? "With" : "Location"}
          </dt>
          <dd className="truncate font-medium">
            {counterparty ??
              workOrder.location?.label ??
              (workOrder.workMode === "remote" ? "Remote" : "—")}
          </dd>
        </div>
      </dl>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }
  return content;
}

export function CredentialCard({ credential }: { credential: Credential }) {
  return (
    <article className="flex flex-col gap-2 border-b border-border py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">{credential.title}</h3>
        <Badge variant="outline">{credentialStatusLabel(credential.verificationStatus)}</Badge>
        {credential.isMocked ? <VerificationBadge /> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {credential.issuingAuthority}
        {credential.jurisdiction ? ` · ${credential.jurisdiction}` : ""}
      </p>
    </article>
  );
}

export function RequirementRow({ requirement }: { requirement: Requirement }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3">
      <div>
        <p className="text-sm font-medium">
          {requirement.label}
          {requirement.required ? (
            <span className="ml-1 text-destructive">*</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {requirement.description}
        </p>
      </div>
      <Badge variant="secondary" className="shrink-0 capitalize">
        {requirement.status.replaceAll("_", " ")}
      </Badge>
    </div>
  );
}

export function DeliverableCard({ deliverable }: { deliverable: Deliverable }) {
  return (
    <div className="border-b border-border py-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{deliverable.title}</p>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {deliverable.type.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {deliverable.description}
      </p>
    </div>
  );
}

export function EvidencePreview({ evidence }: { evidence: Evidence }) {
  return (
    <div className="flex flex-col gap-2 border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium capitalize">
          {evidence.type.replaceAll("_", " ")}
        </span>
        <Badge variant="outline">{evidence.verificationStatus}</Badge>
        {evidence.isMocked ? <VerificationBadge /> : null}
      </div>
      <div className="flex h-28 items-center justify-center bg-muted text-xs text-muted-foreground">
        {evidence.fileUrl ? "Evidence preview (mock)" : "No file"}
      </div>
    </div>
  );
}

export function GovernanceSummary({
  riskLevel,
  explanation,
  isMocked = true,
}: {
  riskLevel: RiskLevel;
  explanation: string;
  isMocked?: boolean;
}) {
  return (
    <aside className="border border-border bg-muted/40 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">Governance recommendation</p>
        <RiskLevelBadge level={riskLevel} />
        {isMocked ? <VerificationBadge /> : null}
      </div>
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </aside>
  );
}

export function ActivityTimeline({ events }: { events: GovernanceEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="border-l-2 border-primary/30 pl-4">
          <p className="text-sm font-medium">{event.eventType.replaceAll("_", " ")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{event.explanation}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={event.createdAt.toISOString()}>
              {event.createdAt.toLocaleString()}
            </time>
            {event.isMocked ? <VerificationBadge /> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PaymentSummary({
  payment,
  workTitle,
  counterparty,
}: {
  payment: Payment;
  workTitle?: string;
  counterparty?: string;
}) {
  return (
    <article className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold">
          {workTitle ?? "Work Order payment"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {payment.status.replaceAll("_", " ")}
          </Badge>
          {counterparty ? (
            <span className="text-xs text-muted-foreground">{counterparty}</span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {payment.authorizedAt
            ? payment.authorizedAt.toLocaleDateString()
            : "Pending date"}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">
        {formatMoney(payment.amount, payment.currency)}
      </p>
    </article>
  );
}

export function WorkerSummary({
  profile,
  name,
}: {
  profile: WorkerProfile;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">{name}</p>
      <p className="text-sm text-muted-foreground">{profile.headline}</p>
      <p className="text-xs text-muted-foreground">
        {profile.completedJobs} completed ·{" "}
        {profile.rating != null ? `${profile.rating.toFixed(1)} rating` : "No rating"}
      </p>
    </div>
  );
}

export function AttentionItemRow({
  item,
}: {
  item: AttentionItem;
}) {
  const href = item.workOrderId ? `/work/${item.workOrderId}` : "/profile";
  const Icon =
    item.kind === "review"
      ? ClipboardCheck
      : item.kind === "credential"
        ? BadgeCheck
        : item.kind === "requirement"
          ? ListChecks
          : item.kind === "dispute"
            ? AlertTriangle
            : Clock;

  return (
    <article className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm animate-in fade-in duration-200 sm:p-4">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:size-11">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={item.priority === "high" ? "destructive" : "secondary"}
              className="capitalize"
            >
              {item.priority}
            </Badge>
            <span className="text-xs text-muted-foreground capitalize">
              {item.kind.replaceAll("_", " ")}
            </span>
            <time
              className="text-xs text-muted-foreground"
              dateTime={item.createdAt.toISOString()}
            >
              {item.createdAt.toLocaleDateString()}
            </time>
          </div>
          <h3 className="mt-1 text-sm font-semibold break-words">{item.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {item.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:mt-2 sm:border-0 sm:pt-0 sm:justify-end">
            <Button asChild size="sm" className="min-h-10">
              <Link href={href}>
                {item.kind === "review" ? "Review" : "Open"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function isNavActive(pathname: string | undefined, href: string) {
  if (!pathname) return false;
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNavigation({
  brandHref = "/",
  links,
  trailing,
  activeHref,
}: {
  brandHref?: string;
  links: { href: string; label: string }[];
  trailing?: ReactNode;
  activeHref?: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 md:h-16 md:px-6">
      <div className="flex min-w-0 items-center gap-4 md:gap-6">
        <Link
          href={brandHref}
          className="shrink-0 text-lg font-semibold tracking-tight text-primary"
        >
          Daisy<span className="text-foreground">.work</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = isNavActive(activeHref, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {trailing}
    </header>
  );
}

export function SideNavigation({
  items,
  activeHref,
}: {
  items: { href: string; label: string; emphasize?: boolean }[];
  activeHref?: string;
}) {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 flex h-[calc(100dvh-4rem)] w-56 shrink-0 flex-col gap-1 border-r border-border p-3"
    >
      {items.map((item) => {
        const active = isNavActive(activeHref, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : item.emphasize
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation({
  items,
  activeHref,
}: {
  items: { href: string; label: string; emphasize?: boolean }[];
  activeHref?: string;
}) {
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5 gap-0.5 px-1 py-1">
        {items.map((item) => {
          const active = isNavActive(activeHref, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                  item.emphasize && !active && "text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    item.emphasize && "bg-primary text-primary-foreground",
                    active && !item.emphasize && "bg-primary/10",
                  )}
                  aria-hidden
                >
                  {item.label.slice(0, 1)}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({
  children,
  side,
  top,
}: {
  children: ReactNode;
  side?: ReactNode;
  top?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      {top}
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl">
        <div className="hidden md:block">{side}</div>
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
