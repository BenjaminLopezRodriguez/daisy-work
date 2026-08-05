"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AdSlot } from "@/components/daisy/ad-slot";
import { BudgetType, formatMoney, WorkMode } from "@/domain";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

/** What Daisy read out of a plain-language search. Money is integer cents. */
type AppliedFilters = {
  q?: string;
  cat?: string;
  mode?: "remote" | "on_site" | "hybrid";
  min?: number;
  max?: number;
  sort?: "recent" | "price_asc" | "price_desc";
};

/** How the job's price reads on a card. Amounts are integer cents. */
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

export function LandingView() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  /** Filters Daisy read out of the last search. Shown as chips, always clearable. */
  const [applied, setApplied] = useState<AppliedFilters | null>(null);

  const { data: allJobs = [], isLoading } = api.work.browse.useQuery(
    searchQuery ? { q: searchQuery } : undefined,
  );

  // ponytail: categories come from the jobs already on screen — no extra endpoint.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of allJobs) {
      counts.set(job.category, (counts.get(job.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [allJobs]);

  const jobs = useMemo(() => {
    let list = category
      ? allJobs.filter((j) => j.category === category)
      : allJobs;

    if (applied?.mode) {
      const want =
        applied.mode === "remote"
          ? WorkMode.Remote
          : applied.mode === "hybrid"
            ? WorkMode.Hybrid
            : WorkMode.OnSite;
      list = list.filter((j) => j.workMode === want);
    }
    if (applied?.min !== undefined) {
      list = list.filter((j) => j.budgetAmount >= applied.min!);
    }
    if (applied?.max !== undefined) {
      list = list.filter((j) => j.budgetAmount <= applied.max!);
    }
    if (applied?.sort === "price_asc") {
      list = [...list].sort((a, b) => a.budgetAmount - b.budgetAmount);
    } else if (applied?.sort === "price_desc") {
      list = [...list].sort((a, b) => b.budgetAmount - a.budgetAmount);
    }
    return list;
  }, [allJobs, category, applied]);

  /** Chips for what Daisy inferred, so it is visible and reversible. */
  const appliedChips = useMemo(() => {
    if (!applied) return [];
    const chips: { key: keyof AppliedFilters; label: string }[] = [];
    if (applied.cat) chips.push({ key: "cat", label: applied.cat });
    if (applied.mode) {
      chips.push({
        key: "mode",
        label: applied.mode === "on_site" ? "On site" : applied.mode === "hybrid" ? "Hybrid" : "Remote",
      });
    }
    if (applied.min !== undefined)
      chips.push({ key: "min", label: `Over ${formatMoney(applied.min, "USD")}` });
    if (applied.max !== undefined)
      chips.push({ key: "max", label: `Under ${formatMoney(applied.max, "USD")}` });
    if (applied.sort && applied.sort !== "recent")
      chips.push({
        key: "sort",
        label: applied.sort === "price_asc" ? "Lowest price" : "Highest price",
      });
    return chips;
  }, [applied]);

  const dropFilter = (key: keyof AppliedFilters) => {
    if (key === "cat") setCategory(null);
    setApplied((prev) => (prev ? { ...prev, [key]: undefined } : prev));
  };

  const filteredHint = useMemo(() => {
    if (searchQuery.trim()) {
      return `${jobs.length} result${jobs.length === 1 ? "" : "s"} for “${searchQuery.trim()}”`;
    }
    if (jobs.length === 0) return null;
    return `${jobs.length} open ${jobs.length === 1 ? "job" : "jobs"}`;
  }, [jobs.length, searchQuery]);

  const requestJob = () => {
    const text = prompt.trim();
    if (!text) return;
    router.push(`/create?q=${encodeURIComponent(text)}`);
  };

  // Search answers on this page. Daisy reads filters out of the query and they
  // land on the grid below — no second screen, no filter form to fill in.
  const parse = api.orchestrator.parseSearchFilters.useMutation();

  const searchJobs = async () => {
    const raw = prompt.trim();
    if (!raw) return;

    setSearchQuery(raw);
    setCategory(null);
    setApplied(null);

    try {
      const { filters } = await parse.mutateAsync({ query: raw.slice(0, 300) });
      setSearchQuery(filters.q ?? raw);
      if (filters.cat) setCategory(filters.cat);
      setApplied(filters);
    } catch {
      // Search must always do something: fall back to the plain text search
      // that is already running from setSearchQuery above.
      toast.error("Could not read filters from your search", {
        description: "Showing text matches instead.",
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPrompt("");
    setCategory(null);
    setApplied(null);
  };

  // Airbnb's collapsing search: once the hero box scrolls away, a compact
  // version of it takes over the header so search is never out of reach.
  const heroRef = useRef<HTMLFormElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry?.isIntersecting),
      // Fire once the hero is behind the header rather than fully gone.
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const expandSearch = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    promptRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header
        className={cn(
          "sticky top-0 z-40",
          "motion-safe:transition-colors motion-safe:duration-200",
          collapsed
            ? "border-b border-border bg-background shadow-sm"
            : "border-b border-transparent bg-background",
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="shrink-0 text-base font-semibold tracking-tight"
          >
            Daisy<span className="text-primary">.work</span>
          </Link>

          {/* Takes over from the hero box once it scrolls out of view. */}
          <div
            className={cn(
              "min-w-0 flex-1 motion-safe:transition-opacity motion-safe:duration-200",
              collapsed
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            aria-hidden={!collapsed}
          >
            <button
              type="button"
              onClick={expandSearch}
              tabIndex={collapsed ? 0 : -1}
              className={cn(
                "mx-auto flex min-h-10 w-full max-w-sm items-center gap-2 rounded-full border border-border bg-card px-4 text-left shadow-sm",
                "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
            >
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-sm text-muted-foreground">
                {prompt.trim() || searchQuery || "What do you need done?"}
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/create">Post a job</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <section className="mx-auto w-full max-w-2xl space-y-5 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Describe what you need. Daisy finds the match.
            </h1>
            <p className="text-sm text-muted-foreground text-pretty sm:text-base">
              Say what you need in plain words. You review it, publish it, and
              people apply. Or search jobs already posted.
            </p>
          </div>

          <form
            ref={heroRef}
            className="rounded-2xl border border-border bg-card p-3 text-left shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              requestJob();
            }}
          >
            <Textarea
              ref={promptRef}
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
                onClick={() => void searchJobs()}
                disabled={parse.isPending || prompt.trim().length === 0}
                aria-busy={parse.isPending}
              >
                <Search className="size-4" aria-hidden />
                {parse.isPending ? "Searching…" : "Search"}
              </Button>
              <Button
                type="submit"
                className="min-h-10"
                disabled={prompt.trim().length === 0}
              >
                Write the posting
              </Button>
            </div>
          </form>
        </section>

        <AdSlot placement="landing" title="Featured partners" />

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Available jobs
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredHint ?? "Jobs that are posted and open to apply to."}
              </p>
            </div>
            {searchQuery ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            ) : null}
          </div>

          {appliedChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Daisy read from your search:
              </span>
              {appliedChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => dropFilter(chip.key)}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1 rounded-full border border-dashed border-border px-3 text-xs font-medium",
                    "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  )}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          ) : null}

          {categories.length > 1 ? (
            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
              role="group"
              aria-label="Filter jobs by category"
            >
              <button
                type="button"
                onClick={() => setCategory(null)}
                aria-pressed={category === null}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-3 text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  category === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                All
              </button>
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  aria-pressed={category === name}
                  className={cn(
                    "min-h-9 shrink-0 rounded-full border px-3 text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    category === name
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {name}{" "}
                  <span className="tabular-nums opacity-60">{count}</span>
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
              <p className="text-sm font-medium">
                {searchQuery ? "No jobs match that search" : "No jobs yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try different words, or describe the job you need above."
                  : "Nothing has been posted yet. Describe a job above to post the first one."}
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
        <section className="space-y-4 border-t border-border pt-10">
          <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Describe it",
                body: "Say what you need in plain words. No forms to fill in.",
              },
              {
                title: "Daisy writes the posting",
                body: "You get a draft with scope, budget and requirements. Edit anything.",
              },
              {
                title: "Publish and hire",
                body: "Your job goes live here. People apply, you pick who does it.",
              },
            ].map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-border bg-card p-4"
              >
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-1 text-sm font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Daisy.work
      </footer>
    </div>
  );
}
