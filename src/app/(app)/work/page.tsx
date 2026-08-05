"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, MapPin, Search } from "lucide-react";

import { AdSlot } from "@/components/daisy/ad-slot";
import {
  AppPage,
  EmptyState,
  PageHeader,
  WorkStatusBadge,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, WorkOrderStatus } from "@/domain";
import { useAppSession } from "@/lib/daisy/session";
import { isWorker } from "@/lib/daisy/role";
import { api } from "@/trpc/react";

function CustomerWorkPage() {
  const { data: jobs = [], isLoading } = api.work.list.useQuery();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return jobs.filter((wo) => {
      const matchesQ =
        q.trim().length === 0 ||
        wo.title.toLowerCase().includes(q.toLowerCase()) ||
        wo.description.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "all" || wo.status === status;
      return matchesQ && matchesStatus;
    });
  }, [jobs, q, status]);

  return (
    <>
      <PageHeader
        title="Your requests"
        description="Jobs you’ve requested or posted."
        actions={
          <Button asChild className="min-h-11">
            <Link href="/create">What do you need?</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your jobs"
            className="h-11 pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            if (typeof value === "string") setStatus(value);
          }}
        >
          <SelectTrigger className="h-11 w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={WorkOrderStatus.Draft}>Draft</SelectItem>
            <SelectItem value={WorkOrderStatus.Published}>Published</SelectItem>
            <SelectItem value={WorkOrderStatus.Assigned}>Assigned</SelectItem>
            <SelectItem value={WorkOrderStatus.Active}>Active</SelectItem>
            <SelectItem value={WorkOrderStatus.Submitted}>Submitted</SelectItem>
            <SelectItem value={WorkOrderStatus.Approved}>Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={jobs.length === 0 ? "No jobs yet" : "No matches"}
          description={
            jobs.length === 0
              ? "Post a job to get started."
              : "Try a different search or status."
          }
          action={
            jobs.length === 0 ? (
              <Button asChild variant="outline">
                <Link href="/create">Post a job</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((wo) => (
            <li key={wo.id}>
              <Link
                href={`/work/${wo.id}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{wo.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <WorkStatusBadge status={wo.status} />
                    <span className="tabular-nums">
                      {formatMoney(wo.budgetAmount, wo.currency)}
                    </span>
                    <span className="capitalize">
                      {wo.workMode.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function WorkerWorkDashboard() {
  const [q, setQ] = useState("");
  const { data: mine = [], isLoading: mineLoading } = api.work.list.useQuery();
  const { data: jobs = [], isLoading: jobsLoading } = api.work.browse.useQuery(
    q.trim() ? { q: q.trim() } : undefined,
  );
  const { data: appData, isLoading: appsLoading } =
    api.application.mine.useQuery();

  const applications = appData?.applications ?? [];
  const inbound = mine.filter((w) => w.status !== "draft");

  return (
    <>
      <PageHeader
        title="Requests"
        description="Inbound service requests and open jobs you can apply to."
        actions={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/services">Your services</Link>
          </Button>
        }
      />

      <AdSlot placement="work_feed" title="Promoted for workers" />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Assigned to you
        </h2>
        {mineLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : inbound.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="When a customer requests one of your services, it shows up here."
            action={
              <Button asChild variant="outline">
                <Link href="/services">Manage services</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {inbound.map((wo) => (
              <li key={wo.id}>
                <Link
                  href={`/work/${wo.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{wo.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {wo.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your applications
        </h2>
        {appsLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No applications yet. Browse open jobs below.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {applications.slice(0, 5).map((app) => (
              <li key={app.id}>
                <Link
                  href={`/work/${app.workOrderId}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {app.jobTitle}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {app.status}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Open jobs
          </h2>
          <div className="relative min-w-0 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search open jobs"
              className="h-11 pl-9"
            />
          </div>
        </div>

        {jobsLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No open jobs"
            description="Check back soon — custom jobs appear when customers post publicly."
            action={
              <Button asChild variant="outline">
                <Link href="/marketplace">Browse marketplace</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {jobs.slice(0, 12).map((wo) => (
              <li key={wo.id}>
                <Link
                  href={`/work/${wo.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{wo.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {formatMoney(wo.budgetAmount, wo.currency)}
                      </span>
                      <span className="capitalize">
                        {wo.workMode.replaceAll("_", " ")}
                      </span>
                      {wo.location?.label ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {wo.location.label}
                        </span>
                      ) : null}
                      <span>
                        {formatDistanceToNow(wo.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function WorkPage() {
  const { currentUser } = useAppSession();
  const worker = isWorker(currentUser.onboardingChoice);

  return (
    <AppPage width="form" className="max-w-3xl space-y-8">
      {worker ? <WorkerWorkDashboard /> : <CustomerWorkPage />}
    </AppPage>
  );
}
