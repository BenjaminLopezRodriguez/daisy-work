"use client";

import { useState } from "react";
import { createRib, useRibLifecycle } from "nextjs-ribs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronRight } from "lucide-react";

import {
  AppPage,
  EmptyState,
  WorkStatusBadge,
} from "@/components/daisy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, type AttentionItem, type WorkOrder } from "@/domain";
import { useAppSession } from "@/lib/daisy/session";
import { seedAttention } from "@/server/mocks/seed";
import type { DaisyServices } from "@/server/services";
import { cn } from "@/lib/utils";

function greetingForNow(name: string) {
  const hour = new Date().getHours();
  const first = name.split(" ")[0] ?? name;
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${period}, ${first}`;
}

export const DashboardRib = createRib({
  name: "Dashboard",
  interactor: (deps: {
    services: DaisyServices;
    userId: string;
    userName: string;
  }) => {
    const [attention] = useState<AttentionItem[]>(seedAttention);
    const [active, setActive] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useRibLifecycle({
      onAttach: () => {
        void deps.services.workOrders
          .listForUser(deps.userId)
          .then((list) => {
            setActive(list.filter((w) => w.status !== "draft"));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      },
    });

    return {
      attention,
      active,
      loading,
      userName: deps.userName,
    };
  },
  presenter: (state) => ({
    greeting: greetingForNow(state.userName),
    attention: state.attention,
    active: state.active,
    loading: state.loading,
    attentionCount: state.attention.length,
    activeCount: state.active.length,
  }),
});

const PROMPT_HINTS = [
  "Photograph every public entrance…",
  "Need a licensed electrician for a panel upgrade…",
  "Get three quotes for HVAC service…",
] as const;

export function DashboardView() {
  const vm = DashboardRib.useViewModel();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const submit = () => {
    const text = prompt.trim();
    if (!text) return;
    router.push(`/create?q=${encodeURIComponent(text)}`);
  };

  const hasLists = vm.attentionCount > 0 || vm.activeCount > 0 || vm.loading;

  return (
    <AppPage
      width="form"
      className="flex min-h-[calc(100dvh-8rem)] max-w-2xl flex-col justify-center gap-10 space-y-0 md:min-h-[calc(100dvh-6rem)]"
    >
      <section className="surface-enter mx-auto w-full space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Daisy.work</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {vm.greeting}
          </h1>
          <p className="text-sm text-muted-foreground text-pretty sm:text-base">
            What needs to be done?
          </p>
        </div>

        <form
          className="surface-enter relative mx-auto w-full text-left"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm ring-1 ring-foreground/5 transition-[box-shadow,border-color] duration-150 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
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
              placeholder={PROMPT_HINTS[0]}
              aria-label="What needs to be done?"
              className="min-h-24 resize-none border-0 bg-transparent px-4 pt-4 pb-14 text-base shadow-none focus-visible:ring-0"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-3">
              <p className="truncate text-xs text-muted-foreground">
                Enter to continue · Shift+Enter for new line
              </p>
              <Button
                type="submit"
                size="icon"
                className={cn(
                  "surface-press size-10 shrink-0 rounded-full",
                  prompt.trim().length === 0 && "opacity-40",
                )}
                disabled={prompt.trim().length === 0}
                aria-label="Continue"
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {PROMPT_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => setPrompt(hint)}
              className="surface-interactive max-w-full truncate rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              {hint}
            </button>
          ))}
        </div>
      </section>

      {hasLists ? (
        <div className="surface-fade mx-auto w-full space-y-8 text-left">
          {(vm.attentionCount > 0 || vm.activeCount > 0) && (
            <p className="text-center text-xs text-muted-foreground">
              {vm.attentionCount > 0
                ? `${vm.attentionCount} need attention`
                : null}
              {vm.attentionCount > 0 && vm.activeCount > 0 ? " · " : null}
              {vm.activeCount > 0 ? `${vm.activeCount} active` : null}
            </p>
          )}

          {vm.attentionCount > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Needs attention
              </h2>
              <ul className="list-stagger divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {vm.attention.map((item) => {
                  const href = item.workOrderId
                    ? `/work/${item.workOrderId}`
                    : "/account";
                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        className="surface-interactive flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                item.priority === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {item.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              {item.kind.replaceAll("_", " ")}
                            </span>
                          </div>
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                        </div>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Active work
              </h2>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                <Link href="/work">Browse</Link>
              </Button>
            </div>
            {vm.loading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : vm.active.length === 0 ? (
              <EmptyState
                title="No active work yet"
                description="Describe something above — Daisy will structure it."
              />
            ) : (
              <ul className="list-stagger divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {vm.active.slice(0, 4).map((wo) => (
                  <li key={wo.id}>
                    <Link
                      href={`/work/${wo.id}`}
                      className="surface-interactive flex min-h-14 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-medium">
                          {wo.title}
                        </p>
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
        </div>
      ) : null}
    </AppPage>
  );
}

export function DashboardScreen() {
  const session = useAppSession();
  return (
    <DashboardRib.Provider
      deps={{
        services: session.services,
        userId: session.currentUser.id,
        userName: session.currentUser.name,
      }}
    >
      <DashboardView />
    </DashboardRib.Provider>
  );
}
