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

  if (session.currentUser.onboardingChoice === "provide") {
    return <ProviderHome firstName={first} />;
  }

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
            Describe what you need — Daisy matches services for you.
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
            placeholder="Describe what you need done…"
            aria-label="Describe what you need"
            className="min-h-20 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={prompt.trim().length === 0}
            >
              Find matches
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

/**
 * Home for someone here to provide services. Leads with their listings and the
 * reach those listings get, rather than the "describe what you need" prompt,
 * which belongs to the hiring side.
 */
function ProviderHome({ firstName }: { firstName: string }) {
  const listings = api.services.mine.useQuery();
  const reach = api.provider.myReach.useQuery();

  const views = reach.data?.profileViewCount ?? 0;
  const clicks = reach.data?.profileClickCount ?? 0;

  return (
    <AppPage width="form" className="max-w-2xl space-y-10">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {firstName}</h1>
        <p className="text-sm text-muted-foreground">
          Your listings and the work coming in.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Your listings
          </h2>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href="/services">Manage</Link>
          </Button>
        </div>

        {listings.isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : !listings.data || listings.data.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="Add a service so people can find you and hire you."
            action={
              <Button asChild>
                <Link href="/services">Add a service</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {listings.data.slice(0, 8).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/services/${s.id}`}
                  className={cn(
                    "flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {formatMoney(s.priceCents, "USD")}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{s.status === "active" ? "Live" : "Paused"}</span>
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

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your profile reach
        </h2>
        {reach.isLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : !reach.data ? (
          <EmptyState
            title="No provider profile yet"
            description="Set one up so people can see who they're hiring."
            action={
              <Button asChild>
                <Link href="/onboarding/provider">Set up profile</Link>
              </Button>
            }
          />
        ) : (
          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4">
            <div>
              <dt className="text-xs text-muted-foreground">Profile views</dt>
              <dd className="text-lg font-semibold tabular-nums">{views}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Profile clicks</dt>
              <dd className="text-lg font-semibold tabular-nums">{clicks}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Looking for work?
        </h2>
        <Button asChild variant="outline">
          <Link href="/marketplace?scope=jobs">Browse open jobs</Link>
        </Button>
      </section>
    </AppPage>
  );
}

export function DashboardScreen() {
  return <DashboardView />;
}
