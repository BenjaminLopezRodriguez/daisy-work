"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronRight } from "lucide-react";

import { AppPage, EmptyState, WorkStatusBadge } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/domain";
import { useAppSession } from "@/lib/daisy/session";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const session = useAppSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const { data: jobs = [], isLoading } = api.work.list.useQuery();

  const first = session.currentUser.name.split(" ")[0] ?? session.currentUser.name;
  const active = jobs.filter((w) => w.status !== "draft");
  const drafts = jobs.filter((w) => w.status === "draft");

  const submit = () => {
    const text = prompt.trim();
    if (!text) return;
    router.push(`/create?q=${encodeURIComponent(text)}`);
  };

  return (
    <AppPage width="form" className="max-w-2xl space-y-10">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hi, {first}
          </h1>
          <p className="text-sm text-muted-foreground">
            Post a job or open work in progress.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="rounded-xl border border-border bg-card p-3 shadow-sm"
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={3}
            placeholder="Describe the job you need done…"
            aria-label="Describe the job"
            className="min-h-20 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={prompt.trim().length === 0}
            >
              Post a job
              <ArrowUp className="size-3.5" aria-hidden />
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Your jobs
          </h2>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href="/work">Browse</Link>
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : active.length === 0 && drafts.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            description="Describe what you need above — Daisy will draft the post."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {[...drafts, ...active].slice(0, 8).map((wo) => (
              <li key={wo.id}>
                <Link
                  href={`/work/${wo.id}`}
                  className={cn(
                    "flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{wo.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <WorkStatusBadge status={wo.status} />
                      <span className="tabular-nums">
                        {formatMoney(wo.budgetAmount, wo.currency)}
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
    </AppPage>
  );
}

export function DashboardScreen() {
  return <DashboardView />;
}
