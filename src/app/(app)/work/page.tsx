"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

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
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
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
        <ul className="divide-border border-border bg-card divide-y overflow-hidden rounded-xl border">
          {filtered.map((wo) => (
            <li key={wo.id}>
              <Link
                href={`/work/${wo.id}`}
                className="hover:bg-muted/40 focus-visible:ring-ring flex min-h-14 items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{wo.title}</p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
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
                  className="text-muted-foreground size-4 shrink-0"
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
  const { data: mine = [], isLoading: mineLoading } = api.work.list.useQuery();
  const { data: appData, isLoading: appsLoading } =
    api.application.mine.useQuery();

  const applications = appData?.applications ?? [];
  const inbound = mine.filter((w) => w.status !== "draft");

  return (
    <>
      <PageHeader
        title="My work"
        description="Jobs assigned to you and applications you’ve sent."
        actions={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/services">Offer</Link>
          </Button>
        }
      />

      <AdSlot placement="work_feed" title="Promoted for workers" />

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium">
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
          <ul className="divide-border border-border bg-card divide-y overflow-hidden rounded-xl border">
            {inbound.map((wo) => (
              <li key={wo.id}>
                <Link
                  href={`/work/${wo.id}`}
                  className="hover:bg-muted/40 focus-visible:ring-ring flex min-h-14 items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{wo.title}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {wo.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          Your applications
        </h2>
        {appsLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : applications.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No applications yet. Find work to apply to under{" "}
            <Link href="/marketplace?scope=jobs" className="underline">
              Find work
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-border border-border bg-card divide-y overflow-hidden rounded-xl border">
            {applications.slice(0, 5).map((app) => (
              <li key={app.id}>
                <Link
                  href={`/work/${app.workOrderId}`}
                  className="hover:bg-muted/40 focus-visible:ring-ring flex min-h-14 items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {app.jobTitle}
                    </p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {app.status}
                    </p>
                  </div>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
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
