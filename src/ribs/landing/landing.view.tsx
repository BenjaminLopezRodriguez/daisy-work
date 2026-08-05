"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AdSlot } from "@/components/daisy/ad-slot";
import { CategoryCards } from "@/components/daisy/category-cards";
import { formatMoney } from "@/domain";
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

export function LandingView() {
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  /** Filters Daisy read out of the last search. Shown as chips, always clearable. */
  const [applied, setApplied] = useState<AppliedFilters | null>(null);

  // The landing sells the supply side: what you can buy right now, not what
  // other people are asking for. Jobs still live on /marketplace.
  const { data: allServices = [], isLoading } =
    api.services.listActive.useQuery({ limit: 48 });

  // ponytail: categories come from the listings already on screen — no extra
  // endpoint. Services carry free-text tags rather than one category column.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const service of allServices) {
      for (const tag of service.tags.length ? service.tags : ["other"]) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [allServices]);

  const services = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    let list = category
      ? allServices.filter((s) => s.tags.includes(category))
      : allServices;

    if (needle) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          s.description.toLowerCase().includes(needle) ||
          s.tags.some((t) => t.toLowerCase().includes(needle)) ||
          (s.ownerName?.toLowerCase().includes(needle) ?? false),
      );
    }
    if (applied?.min !== undefined) {
      list = list.filter((s) => s.priceCents >= applied.min!);
    }
    if (applied?.max !== undefined) {
      list = list.filter((s) => s.priceCents <= applied.max!);
    }
    if (applied?.sort === "price_asc") {
      list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    } else if (applied?.sort === "price_desc") {
      list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    }
    return list;
  }, [allServices, category, applied, searchQuery]);

  /** Chips for what Daisy inferred, so it is visible and reversible. */
  const appliedChips = useMemo(() => {
    if (!applied) return [];
    const chips: { key: keyof AppliedFilters; label: string }[] = [];
    if (applied.cat) chips.push({ key: "cat", label: applied.cat });
    if (applied.mode) {
      chips.push({
        key: "mode",
        label:
          applied.mode === "on_site"
            ? "On site"
            : applied.mode === "hybrid"
              ? "Hybrid"
              : "Remote",
      });
    }
    if (applied.min !== undefined)
      chips.push({
        key: "min",
        label: `Over ${formatMoney(applied.min, "USD")}`,
      });
    if (applied.max !== undefined)
      chips.push({
        key: "max",
        label: `Under ${formatMoney(applied.max, "USD")}`,
      });
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
      return `${services.length} result${services.length === 1 ? "" : "s"} for “${searchQuery.trim()}”`;
    }
    if (services.length === 0) return null;
    return `${services.length} ${services.length === 1 ? "service" : "services"} available`;
  }, [services.length, searchQuery]);

  // Search answers on this page. Daisy reads filters out of the query and they
  // land on the grid below — no second screen, no filter form to fill in.
  const parse = api.orchestrator.parseSearchFilters.useMutation();

  const searchServices = async () => {
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
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    promptRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header
        className={cn(
          "sticky top-0 z-40",
          "motion-safe:transition-colors motion-safe:duration-200",
          collapsed
            ? "border-border bg-background border-b shadow-sm"
            : "bg-background border-b border-transparent",
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
              collapsed ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={!collapsed}
          >
            <button
              type="button"
              onClick={expandSearch}
              tabIndex={collapsed ? 0 : -1}
              className={cn(
                "border-border bg-card mx-auto flex min-h-10 w-full max-w-sm items-center gap-2 rounded-full border px-4 text-left shadow-sm",
                "hover:bg-muted/60 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              <Search
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
              <span className="text-muted-foreground truncate text-sm">
                {prompt.trim() || searchQuery || "What do you need done?"}
              </span>
            </button>
          </div>

          {/* Same set, same order as PublicHeader, so the chrome doesn't shift
              when a visitor moves from here into a job or a profile. */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/marketplace">Browse</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/create">Post a job</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
        <section className="mx-auto w-full max-w-2xl space-y-5 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Describe what you need. Daisy finds the match.
            </h1>
            <p className="text-muted-foreground text-sm text-pretty sm:text-base">
              Search in plain words. If nobody offers it, send it as a request.
            </p>
          </div>

          {/* One action: search. Posting is offered from the empty state, when
              searching has actually failed to find anything. */}
          <form
            ref={heroRef}
            className="border-border bg-card rounded-2xl border p-3 text-left shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void searchServices();
            }}
          >
            <Textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void searchServices();
                }
              }}
              rows={3}
              placeholder="e.g. licensed electrician for a panel upgrade near me"
              aria-label="Search services"
              className="min-h-20 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="submit"
                className="min-h-10 gap-1.5"
                disabled={parse.isPending || prompt.trim().length === 0}
                aria-busy={parse.isPending}
              >
                <Search className="size-4" aria-hidden />
                {parse.isPending ? "Searching…" : "Search"}
              </Button>
            </div>
          </form>

          {/* Directly under the search box: somewhere to go for the visitor who
              has not decided what to type yet. */}
          <CategoryCards
            categories={categories}
            selected={category}
            onSelect={setCategory}
            className="pt-2"
          />
        </section>

        <AdSlot placement="landing" title="Featured partners" />

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Popular services
              </h2>
              <p className="text-muted-foreground text-sm">
                {filteredHint ?? "Services you can book right now."}
              </p>
            </div>
            {searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
              >
                Clear search
              </Button>
            ) : null}
          </div>

          {appliedChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {appliedChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => dropFilter(chip.key)}
                  className={cn(
                    "border-border inline-flex min-h-8 items-center gap-1 rounded-full border border-dashed px-3 text-xs font-medium",
                    "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  )}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <span aria-hidden>×</span>
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
          ) : services.length === 0 ? (
            /* Nothing to show, so offer the other half of the marketplace:
               turn what they searched for into a job posting. */
            <div className="border-border bg-card rounded-xl border p-6 text-center">
              <p className="text-sm font-medium">
                {searchQuery
                  ? "Nobody offers that yet"
                  : "No services listed yet"}
              </p>
              <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
                Send it as a request instead. Daisy works out which skills it
                needs, tags it, and puts it in front of the people who do that
                work.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild className="min-h-10">
                  <Link
                    href={
                      searchQuery
                        ? `/create?q=${encodeURIComponent(prompt.trim() || searchQuery)}`
                        : "/create"
                    }
                  >
                    Send a request
                  </Link>
                </Button>
                {searchQuery ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-10"
                    onClick={clearSearch}
                  >
                    Clear search
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "border-border bg-card focus-within:ring-nav-focus relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-colors",
                    "hover:bg-muted/40 focus-within:ring-2 focus-within:ring-offset-2",
                  )}
                >
                  <div className="bg-muted relative aspect-video w-full">
                    {s.coverImageUrl ? (
                      <Image
                        src={s.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold tracking-tight">
                      {/* Whole-card target via ::after; the provider link below
                          sits above it on z so both stay clickable. (§5.8) */}
                      <Link
                        href={`/services/${s.id}`}
                        className="outline-none after:absolute after:inset-0 after:content-['']"
                      >
                        {s.title}
                      </Link>
                    </h3>
                    {s.ownerName ? (
                      <p className="text-muted-foreground text-xs">
                        <Link
                          href={`/providers/${s.workerProfileId}`}
                          className="focus-visible:ring-nav-focus relative z-10 outline-none hover:underline focus-visible:ring-2"
                        >
                          {s.ownerName}
                        </Link>
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {s.description}
                    </p>
                    <p className="mt-auto pt-2 text-sm font-semibold tabular-nums">
                      {formatMoney(s.priceCents, "USD")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="border-border space-y-4 border-t pt-10">
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
                className="border-border bg-card rounded-xl border p-4"
              >
                <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                  {i + 1}
                </span>
                <h3 className="mt-1 text-sm font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="text-muted-foreground mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs sm:px-6">
        © {new Date().getFullYear()} Daisy.work
      </footer>
    </div>
  );
}
