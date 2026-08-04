"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { WorkStatusBadge } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export function LandingView() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: jobs = [], isLoading } = api.work.browse.useQuery(
    searchQuery ? { q: searchQuery } : undefined,
  );

  const filteredHint = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return `${jobs.length} result${jobs.length === 1 ? "" : "s"} for “${searchQuery.trim()}”`;
  }, [jobs.length, searchQuery]);

  const requestJob = () => {
    const text = prompt.trim();
    if (!text) return;
    router.push(`/create?q=${encodeURIComponent(text)}`);
  };

  const searchJobs = () => {
    setSearchQuery(prompt.trim());
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Daisy<span className="text-primary">.work</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/create">Post a job</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <section className="mx-auto w-full max-w-2xl space-y-5 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              What do you need done?
            </h1>
            <p className="text-sm text-muted-foreground text-pretty sm:text-base">
              Request a new job, or search what’s already posted.
            </p>
          </div>

          <form
            className="rounded-2xl border border-border bg-card p-3 text-left shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              requestJob();
            }}
          >
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  requestJob();
                }
              }}
              rows={3}
              placeholder="e.g. Need a licensed electrician for a panel upgrade…"
              aria-label="Describe a job or search"
              className="min-h-20 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 gap-1.5"
                onClick={searchJobs}
              >
                <Search className="size-4" aria-hidden />
                Search
              </Button>
              <Button
                type="submit"
                className="min-h-10"
                disabled={prompt.trim().length === 0}
              >
                Request
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Available jobs
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredHint ?? "Published jobs open for people to take on."}
              </p>
            </div>
            {searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setPrompt("");
                }}
              >
                Clear search
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
              <p className="text-sm font-medium">No jobs posted yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first — request a job above.
              </p>
            </div>
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
                      <WorkStatusBadge status={wo.status} />
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {formatMoney(wo.budgetAmount, wo.currency)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="line-clamp-2 text-sm font-semibold tracking-tight">
                        {wo.title}
                      </h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {wo.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground capitalize">
                      <span>{wo.category}</span>
                      <span>·</span>
                      <span>{wo.workMode.replaceAll("_", " ")}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Daisy.work
      </footer>
    </div>
  );
}
