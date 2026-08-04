"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Filter, Search } from "lucide-react";

import {
  AppPage,
  EmptyState,
  PageHeader,
  WorkStatusBadge,
  type ActionStatus,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, type WorkOrder } from "@/domain";
import { useAppSession } from "@/lib/daisy/session";
import {
  seedDeliverables,
  seedRequirements,
} from "@/server/mocks/seed";

type StatusFilter = "all" | "active" | "draft" | "submitted";

export default function WorkListPage() {
  const session = useAppSession();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [status, setStatus] = useState<ActionStatus>("loading");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<"due" | "pay" | "recent">("recent");
  const [selected, setSelected] = useState<WorkOrder | null>(null);

  useEffect(() => {
    void session.services.workOrders
      .listForUser(session.currentUser.id)
      .then((list) => {
        setItems(list);
        setStatus("idle");
      })
      .catch(() => setStatus("failed"));
  }, [session]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab === "active") {
      list = list.filter(
        (w) => !["draft", "cancelled", "disputed", "paid"].includes(w.status),
      );
    } else if (tab !== "all") {
      list = list.filter((w) => w.status === tab);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((w) => w.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "pay") return b.budgetAmount - a.budgetAmount;
      if (sort === "due") {
        return (
          (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
        );
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [items, tab, query, sort]);

  const reqs = selected
    ? seedRequirements.filter((r) => r.workOrderId === selected.id)
    : [];
  const dels = selected
    ? seedDeliverables.filter((d) => d.workOrderId === selected.id)
    : [];

  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader
        title="Work"
        description="Open a row to see details."
        actions={
          <Button asChild className="min-h-11">
            <Link href="/create">Post work</Link>
          </Button>
        }
      />

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="min-h-11 pl-9"
            aria-label="Search work"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="min-h-11" aria-label="Filters">
              <Filter className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="space-y-4">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 px-1 pb-4">
              <Select
                value={tab}
                onValueChange={(v) => setTab(v as StatusFilter)}
              >
                <SelectTrigger className="min-h-11" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as typeof sort)}
              >
                <SelectTrigger className="min-h-11" aria-label="Sort">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="due">Due date</SelectItem>
                  <SelectItem value="pay">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {status === "loading" ? <Skeleton className="h-40 rounded-xl" /> : null}

      {status !== "loading" && filtered.length === 0 ? (
        <EmptyState
          title="No matching work"
          description="Try another search, or post something new."
          action={
            <Button asChild>
              <Link href="/create">Post work</Link>
            </Button>
          }
        />
      ) : null}

      {status !== "loading" && filtered.length > 0 ? (
        <ul className="list-stagger divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {filtered.map((wo) => (
            <li key={wo.id}>
              <button
                type="button"
                onClick={() => setSelected(wo)}
                className="surface-interactive flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{wo.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums font-medium text-foreground">
                      {formatMoney(wo.budgetAmount, wo.currency)}
                    </span>
                    <span>
                      {wo.dueAt
                        ? `Due ${wo.dueAt.toLocaleDateString()}`
                        : "No due date"}
                    </span>
                    <span>
                      {wo.location?.label ??
                        (wo.workMode === "remote" ? "Remote" : "On-site")}
                    </span>
                  </div>
                  <WorkStatusBadge status={wo.status} />
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Drawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-left break-words">
              {selected?.title}
            </DrawerTitle>
          </DrawerHeader>
          {selected ? (
            <div
              key={selected.id}
              className="surface-fade space-y-4 overflow-y-auto px-4 pb-2 text-sm"
            >
              <p className="text-muted-foreground text-pretty">
                {selected.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <WorkStatusBadge status={selected.status} />
                <span className="tabular-nums font-medium">
                  {formatMoney(selected.budgetAmount, selected.currency)}
                </span>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  What’s needed
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  {reqs.length === 0 ? (
                    <li>No special requirements</li>
                  ) : (
                    reqs.map((r) => <li key={r.id}>{r.label}</li>)
                  )}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Proof to submit
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  {                    dels.map((d) => (
                      <li key={d.id}>{d.title}</li>
                    ))}
                </ul>
              </div>
            </div>
          ) : null}
          <DrawerFooter>
            {selected ? (
              <Button asChild className="min-h-11">
                <Link href={`/work/${selected.id}`}>
                  {selected.status === "submitted"
                    ? "Review submission"
                    : "Open workspace"}
                </Link>
              </Button>
            ) : null}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AppPage>
  );
}
