"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MapPin } from "lucide-react";

import { AdSlot } from "@/components/daisy/ad-slot";
import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetType, formatMoney } from "@/domain";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

function priceLabel(job: {
  budgetType: BudgetType;
  budgetAmount: number;
  currency: string;
}) {
  const money = formatMoney(job.budgetAmount, job.currency);
  if (job.budgetType === BudgetType.Hourly) return `${money}/hr`;
  if (job.budgetType === BudgetType.Milestone) return `${money} total`;
  return `${money} fixed`;
}

type Tab = "services" | "jobs";

export default function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("services");
  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allJobs = [], isLoading: jobsLoading } = api.work.browse.useQuery(
    searchQuery ? { q: searchQuery } : undefined,
  );
  const { data: services = [], isLoading: servicesLoading } =
    api.services.listActive.useQuery({ limit: 24 });

  const jobs = useMemo(() => allJobs, [allJobs]);

  const filteredServices = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return services;
    return services.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        s.description.toLowerCase().includes(needle) ||
        s.tags.some((t) => t.toLowerCase().includes(needle)) ||
        (s.ownerName?.toLowerCase().includes(needle) ?? false),
    );
  }, [services, searchQuery]);

  return (
    <AppPage width="form" className="max-w-5xl space-y-8">
      <PageHeader
        title="Marketplace"
        description="Browse packaged services first. Open jobs are for custom work."
        actions={
          <Button asChild className="min-h-11">
            <Link href="/create">What do you need?</Link>
          </Button>
        }
      />

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchQuery(q.trim());
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === "services" ? "Search services…" : "Search open jobs…"
          }
          className="h-11"
          aria-label="Search marketplace"
        />
        <Button type="submit" className="min-h-11 shrink-0">
          Search
        </Button>
      </form>

      <div className="flex gap-2 border-b border-border pb-px">
        {(
          [
            ["services", "Services"],
            ["jobs", "Open jobs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "min-h-10 border-b-2 px-3 text-sm font-medium transition-colors",
              tab === id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <AdSlot placement="marketplace" title="Featured" />

      {tab === "services" ? (
        <section className="space-y-4">
          {servicesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No services match" : "No services yet"}
              description={
                searchQuery
                  ? "Try different words or browse open jobs."
                  : "Workers can list packaged services from their Services tab."
              }
              action={
                searchQuery ? (
                  <Button type="button" variant="outline" onClick={() => setTab("jobs")}>
                    See open jobs
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/create">Describe what you need</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.id}`}
                    className={cn(
                      "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm outline-none transition-colors",
                      "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <div className="relative aspect-video w-full bg-muted">
                      {s.coverImageUrl ? (
                        <Image
                          src={s.coverImageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="line-clamp-2 text-sm font-semibold tracking-tight">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.ownerName}
                      </p>
                      <p className="mt-auto text-xs font-medium tabular-nums">
                        {formatMoney(s.priceCents, "USD")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {jobsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No jobs match" : "No open jobs"}
              description={
                searchQuery
                  ? "Try different words or clear the search."
                  : "Custom jobs appear here when customers post publicly."
              }
              action={
                searchQuery ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setQ("");
                    }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/create">Describe a need</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((wo) => (
                <li key={wo.id}>
                  <Link
                    href={`/work/${wo.id}`}
                    className={cn(
                      "flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {wo.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(wo.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="line-clamp-2 text-sm font-semibold tracking-tight">
                        {wo.title}
                      </h3>
                      <p className="line-clamp-3 text-xs text-muted-foreground">
                        {wo.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="font-semibold tabular-nums text-foreground">
                        {priceLabel(wo)}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="capitalize">
                        {wo.workMode.replaceAll("_", " ")}
                      </span>
                      {wo.location?.label ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {wo.location.label}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AppPage>
  );
}
