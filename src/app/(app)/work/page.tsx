"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

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
import { api } from "@/trpc/react";

export default function WorkPage() {
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
    <AppPage width="form" className="max-w-3xl space-y-6">
      <PageHeader
        title="Work"
        description="Jobs you’ve posted or are working on."
        actions={
          <Button asChild className="min-h-11">
            <Link href="/create">Post a job</Link>
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
            placeholder="Search jobs"
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
    </AppPage>
  );
}
