"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AdSlot } from "@/components/daisy/ad-slot";
import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BudgetType, formatMoney, WorkMode } from "@/domain";
import { isWorker } from "@/lib/daisy/role";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* URL contract (§3.3). Absent param = default. Never serialize a default. */
/* ------------------------------------------------------------------ */

const SCOPES = ["services", "jobs"] as const;
const SORTS = ["recent", "price_asc", "price_desc"] as const;
const MODES = [WorkMode.Remote, WorkMode.OnSite, WorkMode.Hybrid] as const;

type Scope = (typeof SCOPES)[number];
type Sort = (typeof SORTS)[number];

const scopeParam = z.enum(SCOPES).catch("services");
const sortParam = z.enum(SORTS).catch("recent");
const modeParam = z.enum(MODES).optional().catch(undefined);
const textParam = z.string().trim().min(1).max(128).optional().catch(undefined);
/** Integer minor units (cents), consistent with the domain. */
const centsParam = z.coerce
  .number()
  .int()
  .min(0)
  .max(100_000_00)
  .optional()
  .catch(undefined);

type BrowseState = {
  scope: Scope;
  q: string;
  cat?: string;
  mode?: (typeof MODES)[number];
  min?: number;
  max?: number;
  sort: Sort;
};

function useBrowseState(defaultScope: Scope) {
  const sp = useSearchParams();
  const router = useRouter();

  const raw = (k: string) => sp.get(k) ?? undefined;
  const state: BrowseState = {
    // An absent `scope` follows the viewer's mode: a provider browsing came
    // here to find work, not to shop for other providers' services. Derived
    // only — rewriting the URL would make the tabs fight the back button.
    scope: raw("scope") ? scopeParam.parse(raw("scope")) : defaultScope,
    q: textParam.parse(raw("q")) ?? "",
    cat: textParam.parse(raw("cat")),
    mode: modeParam.parse(raw("mode")),
    min: centsParam.parse(raw("min")),
    max: centsParam.parse(raw("max")),
    sort: sortParam.parse(raw("sort")),
  };

  /**
   * Filter tweaks `replace` so back exits browse; scope changes `push`
   * because they are genuine destinations (§3.3).
   */
  const write = useCallback(
    (
      patch: Record<string, string | number | undefined>,
      nav: "replace" | "push" = "replace",
    ) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      const qs = next.toString();
      router[nav](qs ? `/marketplace?${qs}` : "/marketplace", {
        scroll: false,
      });
    },
    [router, sp],
  );

  return { ...state, write };
}

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

function sortItems<T>(
  items: T[],
  sort: Sort,
  price: (t: T) => number,
  date: (t: T) => Date,
) {
  const list = [...items];
  if (sort === "price_asc") return list.sort((a, b) => price(a) - price(b));
  if (sort === "price_desc") return list.sort((a, b) => price(b) - price(a));
  return list.sort((a, b) => date(b).getTime() - date(a).getTime());
}

const centsToInput = (c?: number) => (c === undefined ? "" : String(c / 100));
const inputToCents = (v: string) => {
  const n = Number(v.trim());
  return v.trim() === "" || !Number.isFinite(n) || n < 0
    ? undefined
    : Math.round(n * 100);
};

const MODE_LABEL: Record<string, string> = {
  [WorkMode.Remote]: "Remote",
  [WorkMode.OnSite]: "On site",
  [WorkMode.Hybrid]: "Hybrid",
};

/* ------------------------------------------------------------------ */
/* Category rail (§5.3) — derived from data, roving tabindex.          */
/* ------------------------------------------------------------------ */

function CategoryRail({
  categories,
  active,
  onSelect,
  controls,
}: {
  categories: { name: string; count: number }[];
  active?: string;
  onSelect: (cat?: string) => void;
  controls: string;
}) {
  const [focusIdx, setFocusIdx] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  if (categories.length === 0) return null;

  const chips = [{ name: "", count: 0 }, ...categories];

  const move = (i: number) => {
    const next = (i + chips.length) % chips.length;
    setFocusIdx(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className="gap-rail-gap -mx-1 flex overflow-x-auto px-1 pb-1"
      onKeyDown={(e) => {
        const step: Record<string, number | undefined> = {
          ArrowRight: focusIdx + 1,
          ArrowLeft: focusIdx - 1,
          Home: 0,
          End: chips.length - 1,
        };
        const target = step[e.key];
        if (target === undefined) return;
        e.preventDefault();
        move(target);
      }}
    >
      {chips.map((c, i) => {
        const isAll = c.name === "";
        const selected = isAll ? !active : active === c.name;
        return (
          <button
            key={c.name || "__all__"}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controls}
            aria-label={isAll ? "All categories" : `${c.name}, ${c.count} jobs`}
            tabIndex={focusIdx === i ? 0 : -1}
            onFocus={() => setFocusIdx(i)}
            onClick={() => onSelect(selected || isAll ? undefined : c.name)}
            className={cn(
              "rounded-nav-pill text-chip min-h-11 shrink-0 border px-3 whitespace-nowrap transition-colors outline-none",
              "focus-visible:ring-nav-focus focus-visible:ring-2 focus-visible:ring-offset-2",
              selected
                ? "bg-nav-accent text-nav-accent-ink border-transparent"
                : "border-nav-hairline text-nav-ink-muted hover:text-nav-ink",
            )}
          >
            {isAll ? "All" : `${c.name} ${c.count}`}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter surface (§5.4) — four groups, client-side, URL-reflected.    */
/* ------------------------------------------------------------------ */

function FilterGroups({
  state,
  categories,
  showCategory,
}: {
  state: ReturnType<typeof useBrowseState>;
  categories: { name: string; count: number }[];
  showCategory: boolean;
}) {
  const { scope, cat, mode, min, max, sort, write } = state;
  const jobs = scope === "jobs";

  const radio = (
    name: string,
    value: string,
    checked: boolean,
    label: string,
    onPick: () => void,
  ) => (
    <label
      key={value}
      className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onPick}
        className="accent-nav-active focus-visible:ring-nav-focus size-4 focus-visible:ring-2 focus-visible:ring-offset-2"
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-4">
      {jobs && showCategory && categories.length > 0 ? (
        <fieldset className="border-nav-hairline border-b pb-4">
          <legend className="text-nav-ink-muted text-xs font-medium">
            Category
          </legend>
          {radio("cat", "__all__", !cat, "All", () =>
            write({ cat: undefined }),
          )}
          {categories.map((c) =>
            radio("cat", c.name, cat === c.name, `${c.name} (${c.count})`, () =>
              write({ cat: c.name }),
            ),
          )}
        </fieldset>
      ) : null}

      <fieldset className="border-nav-hairline space-y-2 border-b pb-4">
        <legend className="text-nav-ink-muted text-xs font-medium">
          Budget
        </legend>
        <div className="flex items-center gap-2">
          <Input
            key={`min-${min ?? ""}`}
            type="number"
            min={0}
            inputMode="decimal"
            defaultValue={centsToInput(min)}
            onBlur={(e) => write({ min: inputToCents(e.target.value) })}
            placeholder="Min $"
            aria-label="Minimum budget in dollars"
            className="h-11 tabular-nums"
          />
          <span aria-hidden className="text-nav-ink-muted">
            –
          </span>
          <Input
            key={`max-${max ?? ""}`}
            type="number"
            min={0}
            inputMode="decimal"
            defaultValue={centsToInput(max)}
            onBlur={(e) => write({ max: inputToCents(e.target.value) })}
            placeholder="Max $"
            aria-label="Maximum budget in dollars"
            className="h-11 tabular-nums"
          />
        </div>
      </fieldset>

      {jobs ? (
        <fieldset className="border-nav-hairline border-b pb-4">
          <legend className="text-nav-ink-muted text-xs font-medium">
            Work mode
          </legend>
          {radio("mode", "__any__", !mode, "Any", () =>
            write({ mode: undefined }),
          )}
          {MODES.map((m) =>
            radio("mode", m, mode === m, MODE_LABEL[m]!, () =>
              write({ mode: m }),
            ),
          )}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-nav-ink-muted text-xs font-medium">Sort</legend>
        {(
          [
            ["recent", "Most recent"],
            ["price_asc", "Price: low to high"],
            ["price_desc", "Price: high to low"],
          ] as const
        ).map(([value, label]) =>
          radio("sort", value, sort === value, label, () =>
            write({ sort: value === "recent" ? undefined : value }),
          ),
        )}
      </fieldset>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const RESULTS_ID = "browse-results";

function MarketplaceBrowse() {
  // Public page: `me.get` returns null when signed out, so this stays usable
  // without an auth gate.
  const { data: me } = api.me.get.useQuery();
  const provider = isWorker(me?.onboardingChoice);

  const state = useBrowseState(provider ? "jobs" : "services");
  const { scope, q, cat, mode, min, max, sort, write } = state;
  const [sheetOpen, setSheetOpen] = useState(false);
  /** What the last parse inferred, so it can be shown and undone (§task 2). */
  const [inferred, setInferred] = useState<{
    raw: string;
    keys: string[];
  } | null>(null);

  const parse = api.orchestrator.parseSearchFilters.useMutation();

  const runSearch = async (rawInput: string) => {
    const raw = rawInput.trim();
    const reset = {
      cat: undefined,
      mode: undefined,
      min: undefined,
      max: undefined,
      sort: undefined,
    };
    if (!raw) {
      setInferred(null);
      write({ q: undefined, ...reset });
      return;
    }
    try {
      const { filters } = await parse.mutateAsync({ query: raw.slice(0, 300) });
      const patch = {
        q: filters.q ?? raw,
        cat: filters.cat,
        mode: filters.mode,
        min: filters.min,
        max: filters.max,
        sort: filters.sort === "recent" ? undefined : filters.sort,
      };
      const keys = Object.entries(patch)
        .filter(([k, v]) => k !== "q" && v !== undefined)
        .map(([k]) => k);
      setInferred(keys.length > 0 ? { raw, keys } : null);
      write({ ...reset, ...patch });
    } catch {
      // Search must always do something: plain text search.
      setInferred(null);
      write({ q: raw, ...reset });
      toast.error("Could not read filters from your search", {
        description: "Searched by text instead.",
      });
    }
  };

  const undoInferred = () => {
    const raw = inferred?.raw ?? q;
    setInferred(null);
    write({
      q: raw || undefined,
      cat: undefined,
      mode: undefined,
      min: undefined,
      max: undefined,
      sort: undefined,
    });
  };

  const { data: allJobs = [], isLoading: jobsLoading } =
    api.work.browse.useQuery(q ? { q } : undefined);
  const { data: services = [], isLoading: servicesLoading } =
    api.services.listActive.useQuery({ limit: 24 });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of allJobs)
      counts.set(j.category, (counts.get(j.category) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [allJobs]);

  const jobs = useMemo(() => {
    const list = allJobs.filter(
      (j) =>
        (!cat || j.category === cat) &&
        (!mode || j.workMode === mode) &&
        (min === undefined || j.budgetAmount >= min) &&
        (max === undefined || j.budgetAmount <= max),
    );
    return sortItems(
      list,
      sort,
      (j) => j.budgetAmount,
      (j) => j.createdAt,
    );
  }, [allJobs, cat, mode, min, max, sort]);

  const filteredServices = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = services.filter(
      (s) =>
        (!needle ||
          s.title.toLowerCase().includes(needle) ||
          s.description.toLowerCase().includes(needle) ||
          s.tags.some((t) => t.toLowerCase().includes(needle)) ||
          (s.ownerName?.toLowerCase().includes(needle) ?? false)) &&
        (min === undefined || s.priceCents >= min) &&
        (max === undefined || s.priceCents <= max),
    );
    return sortItems(
      list,
      sort,
      (s) => s.priceCents,
      (s) => s.createdAt,
    );
  }, [services, q, min, max, sort]);

  const activeFilters = [
    cat
      ? { key: "cat", label: cat, clear: () => write({ cat: undefined }) }
      : null,
    mode
      ? {
          key: "mode",
          label: MODE_LABEL[mode]!,
          clear: () => write({ mode: undefined }),
        }
      : null,
    min !== undefined
      ? {
          key: "min",
          label: `Min ${formatMoney(min, "USD")}`,
          clear: () => write({ min: undefined }),
        }
      : null,
    max !== undefined
      ? {
          key: "max",
          label: `Max ${formatMoney(max, "USD")}`,
          clear: () => write({ max: undefined }),
        }
      : null,
    sort !== "recent"
      ? {
          key: "sort",
          label: sort === "price_asc" ? "Price ↑" : "Price ↓",
          clear: () => write({ sort: undefined }),
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  const clearAll = () =>
    write({
      cat: undefined,
      mode: undefined,
      min: undefined,
      max: undefined,
      sort: undefined,
    });

  const resultCount =
    scope === "services" ? filteredServices.length : jobs.length;

  // Only chips still present in the URL count as inferred.
  const activeKeys = new Set(activeFilters.map((f) => f.key));
  const inferredKeys = (inferred?.keys ?? []).filter((k) => activeKeys.has(k));
  const filterLabel =
    activeFilters.length > 0
      ? `Filters, ${activeFilters.length} active`
      : "Filters";

  return (
    <AppPage width="form" className="max-w-6xl space-y-8">
      <PageHeader
        title="Marketplace"
        description={
          provider
            ? "Open jobs you can apply to. Services are what other providers offer."
            : "Browse packaged services first. Open jobs are for custom work."
        }
        actions={
          <Button asChild className="min-h-11">
            {/* Posting a job is the customer's action; a provider standing here
                wants to list what they do. */}
            <Link href={provider ? "/services" : "/create"}>
              {provider ? "Offer a service" : "What do you need?"}
            </Link>
          </Button>
        }
      />

      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q");
          void runSearch(typeof value === "string" ? value : "");
        }}
      >
        <Input
          key={q}
          name="q"
          defaultValue={q}
          placeholder={
            scope === "services" ? "Search services…" : "Search open jobs…"
          }
          className="text-search h-11"
          aria-label="Search the marketplace"
        />
        <Button
          type="submit"
          className="min-h-11 shrink-0"
          disabled={parse.isPending}
          aria-busy={parse.isPending}
        >
          {parse.isPending ? "Searching…" : "Search"}
        </Button>
      </form>

      <div
        role="tablist"
        aria-label="Search scope"
        className="border-nav-hairline flex gap-2 border-b pb-px"
      >
        {(
          [
            ["services", "Services"],
            ["jobs", "Open jobs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={scope === id}
            aria-controls={RESULTS_ID}
            onClick={() =>
              write(
                {
                  scope: id === "services" ? undefined : id,
                  cat: undefined,
                  mode: undefined,
                },
                "push",
              )
            }
            className={cn(
              "min-h-11 border-b-2 px-3 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-nav-focus focus-visible:ring-2 focus-visible:ring-offset-2",
              scope === id
                ? "border-nav-active text-nav-ink"
                : "text-nav-ink-muted hover:text-nav-ink border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {scope === "jobs" ? (
        <CategoryRail
          categories={categories}
          active={cat}
          onSelect={(next) => write({ cat: next })}
          controls={RESULTS_ID}
        />
      ) : null}

      <AdSlot placement="marketplace" title="Featured" />

      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative size-11 shrink-0 lg:hidden"
              aria-label={filterLabel}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              {activeFilters.length > 0 ? (
                <span
                  aria-hidden
                  className="bg-nav-accent text-nav-accent-ink absolute -top-1 -right-1 min-w-5 rounded-full px-1 text-xs leading-5 font-medium tabular-nums"
                >
                  {activeFilters.length}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <FilterGroups
                state={state}
                categories={categories}
                showCategory
              />
            </div>
            <SheetFooter className="flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 flex-1"
                onClick={clearAll}
              >
                Clear all
              </Button>
              <Button
                type="button"
                className="min-h-11 flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Show {resultCount} results
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative hidden size-11 shrink-0 lg:inline-flex"
              aria-label={filterLabel}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              {activeFilters.length > 0 ? (
                <span
                  aria-hidden
                  className="bg-nav-accent text-nav-accent-ink absolute -top-1 -right-1 min-w-5 rounded-full px-1 text-xs leading-5 font-medium tabular-nums"
                >
                  {activeFilters.length}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-[70dvh] w-80 overflow-y-auto"
          >
            <FilterGroups state={state} categories={categories} showCategory />
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11 w-full"
              onClick={clearAll}
            >
              Clear all
            </Button>
          </PopoverContent>
        </Popover>

        {inferredKeys.length > 0 ? (
          <>
            <span className="text-chip text-nav-ink-muted">
              From your search:
            </span>
            <Button
              type="button"
              variant="ghost"
              className="text-chip min-h-11"
              onClick={undoInferred}
            >
              Undo these filters
            </Button>
          </>
        ) : null}

        {activeFilters.map((f) => {
          const auto = inferredKeys.includes(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              aria-label={`Remove filter: ${f.label}${auto ? " (from your search)" : ""}`}
              className={cn(
                "rounded-nav-pill text-chip text-nav-ink focus-visible:ring-nav-focus min-h-11 px-3 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                auto
                  ? "border-nav-active bg-nav-active-wash border border-dashed"
                  : "bg-nav-active-wash",
              )}
            >
              {f.label} ✕
            </button>
          );
        })}
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <h2 className="sr-only">Filters</h2>
          <FilterGroups
            state={state}
            categories={categories}
            showCategory={false}
          />
        </aside>

        <section id={RESULTS_ID} className="min-w-0 flex-1 space-y-4">
          <p aria-live="polite" className="sr-only">
            {resultCount} results
          </p>

          {scope === "services" ? (
            servicesLoading ? (
              <ResultsSkeleton />
            ) : filteredServices.length === 0 ? (
              <EmptyState
                title={q ? "No services match" : "No services yet"}
                description={
                  q
                    ? "Try different words or browse open jobs."
                    : "Workers can list packaged services from their Services tab."
                }
                action={
                  activeFilters.length > 0 || q ? (
                    <Button type="button" variant="outline" onClick={clearAll}>
                      Clear all filters
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href="/create">Describe what you need</Link>
                    </Button>
                  )
                }
              />
            ) : (
              <ul className="gap-grid-gutter grid sm:grid-cols-2 xl:grid-cols-3">
                {filteredServices.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "rounded-nav-card border-border bg-card relative flex h-full flex-col overflow-hidden border shadow-sm transition-colors",
                      "hover:bg-muted/40 focus-within:ring-nav-focus focus-within:ring-2 focus-within:ring-offset-2",
                    )}
                  >
                    <div className="bg-muted relative aspect-video w-full">
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
                        {/* Primary target: ::after overlay makes the whole card clickable (§5.8). */}
                        <Link
                          href={`/services/${s.id}`}
                          className="outline-none after:absolute after:inset-0 after:content-['']"
                        >
                          {s.title}
                        </Link>
                      </p>
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
                      <p className="mt-auto text-xs font-medium tabular-nums">
                        {formatMoney(s.priceCents, "USD")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : jobsLoading ? (
            <ResultsSkeleton />
          ) : jobs.length === 0 ? (
            <EmptyState
              title={q ? "No jobs match" : "No open jobs"}
              description={
                q
                  ? "Try different words or clear the search."
                  : "Custom jobs appear here when customers post publicly."
              }
              action={
                q || activeFilters.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      write({
                        q: undefined,
                        cat: undefined,
                        mode: undefined,
                        min: undefined,
                        max: undefined,
                        sort: undefined,
                      })
                    }
                  >
                    Clear all filters
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/create">Describe a need</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className="gap-grid-gutter grid sm:grid-cols-2 xl:grid-cols-3">
              {jobs.map((wo) => (
                <li
                  key={wo.id}
                  className={cn(
                    "rounded-nav-card border-border bg-card relative flex h-full flex-col gap-3 border p-4 shadow-sm transition-colors",
                    "hover:bg-muted/40 focus-within:ring-nav-focus focus-within:ring-2 focus-within:ring-offset-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {wo.category}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(wo.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold tracking-tight">
                      <Link
                        href={`/work/${wo.id}`}
                        className="outline-none after:absolute after:inset-0 after:content-['']"
                      >
                        {wo.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 text-xs">
                      {wo.description}
                    </p>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="text-foreground font-semibold tabular-nums">
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
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppPage>
  );
}

function ResultsSkeleton() {
  return (
    <div className="gap-grid-gutter grid sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="rounded-nav-card h-40" />
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={null}>
      <MarketplaceBrowse />
    </Suspense>
  );
}
