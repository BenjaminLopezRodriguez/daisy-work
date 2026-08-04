"use client";

import { useEffect, useState } from "react";
import { createRib, useRibLifecycle } from "nextjs-ribs";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  AppPage,
  FormField,
  MobileStickyActions,
  PageHeader,
  StepProgress,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/domain";
import { useAppSession } from "@/lib/daisy/session";
import {
  createDraftFromPlan,
  planWorkFromMessage,
  type WorkPlan,
} from "@/server/orchestrator";
import type { DaisyServices } from "@/server/services";

const STAGES = ["Describe", "Review", "Post"] as const;

export const CreateWorkRib = createRib({
  name: "CreateWork",
  interactor: (deps: {
    services: DaisyServices;
    requesterId: string;
    initialMessage?: string;
  }) => {
    const [stage, setStage] = useState(0);
    const [message, setMessage] = useState(deps.initialMessage?.trim() ?? "");
    const [plan, setPlan] = useState<WorkPlan | null>(null);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [published, setPublished] = useState(false);
    const [dirty, setDirty] = useState(Boolean(deps.initialMessage?.trim()));

    useRibLifecycle({});

    const prepareDraft = async () => {
      setBusy(true);
      const toastId = toast.loading("Daisy is preparing a draft…");
      try {
        const result = await planWorkFromMessage({
          message,
          userId: deps.requesterId,
        });
        if (result.kind === "ask_user") {
          toast.message("Need a bit more", {
            id: toastId,
            description: result.question,
          });
          return;
        }
        if (result.kind === "unavailable") {
          toast.error("Daisy unavailable", {
            id: toastId,
            description: result.message,
          });
          return;
        }
        setPlan(result.plan);
        const created = await createDraftFromPlan(
          {
            userId: deps.requesterId,
            services: {
              createDraft: (input) => deps.services.workOrders.createDraft(input),
              publish: async (input) => {
                await deps.services.workOrders.publish(input);
              },
            },
          },
          result.plan,
          deps.requesterId,
        );
        setDraftId(created.draftId);
        setDirty(false);
        setStage(1);
        toast.success("Draft ready", {
          id: toastId,
          description: result.explanation,
        });
      } catch {
        toast.error("Could not prepare draft", { id: toastId });
      } finally {
        setBusy(false);
      }
    };

    const publish = async () => {
      if (!draftId) return;
      setBusy(true);
      const toastId = toast.loading("Publishing…");
      try {
        await deps.services.workOrders.publish({ workOrderId: draftId });
        setPublished(true);
        setDirty(false);
        setStage(2);
        toast.success("Posted", {
          id: toastId,
          description: "Payments and verification stay mocked in this demo.",
        });
      } catch {
        toast.error("Publish failed", { id: toastId });
      } finally {
        setBusy(false);
      }
    };

    return {
      stage,
      setStage,
      message,
      setMessage: (v: string) => {
        setDirty(true);
        setMessage(v);
      },
      plan,
      setPlan: (next: WorkPlan) => {
        setDirty(true);
        setPlan(next);
      },
      draftId,
      busy,
      published,
      dirty,
      prepareDraft,
      publish,
      steps: STAGES,
    };
  },
  router: (state) => ({
    describe: state.stage === 0,
    review: state.stage === 1,
    post: state.stage === 2,
  }),
  presenter: (state) => state,
});

export function CreateWorkView() {
  const vm = CreateWorkRib.useViewModel();
  const describe = CreateWorkRib.useRoute("describe");
  const review = CreateWorkRib.useRoute("review");
  const post = CreateWorkRib.useRoute("post");
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);
  const ready = vm.message.trim().length >= 10;

  useEffect(() => {
    if (!vm.dirty || vm.published) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [vm.dirty, vm.published]);

  const updatePlan = <K extends keyof WorkPlan>(key: K, value: WorkPlan[K]) => {
    if (!vm.plan) return;
    vm.setPlan({ ...vm.plan, [key]: value });
  };

  return (
    <AppPage width="form" className="pb-24 md:pb-0">
      <PageHeader
        title="Post"
        description="Say what you need. Daisy structures the rest."
      />

      <StepProgress steps={vm.steps} currentIndex={vm.stage} />

      {describe.attached ? (
        <section className="surface-enter space-y-5">
          <FormField
            id="need"
            label="What needs to be done?"
            required
            helper="One or two sentences is enough."
          >
            <Textarea
              id="need"
              value={vm.message}
              onChange={(e) => vm.setMessage(e.target.value)}
              rows={6}
              placeholder="Photograph every public entrance at this property…"
              className="min-h-40 text-base"
            />
          </FormField>
          <div className="hidden md:block">
            <Button
              type="button"
              className="min-h-11 w-full sm:w-auto"
              disabled={!ready || vm.busy}
              onClick={() => void vm.prepareDraft()}
            >
              {vm.busy ? "Preparing…" : "Create draft"}
            </Button>
          </div>
        </section>
      ) : null}

      {review.attached && vm.plan ? (
        <section className="surface-enter space-y-5">
          <FormField id="title" label="Title" required>
            <Input
              id="title"
              value={vm.plan.title}
              onChange={(e) => updatePlan("title", e.target.value)}
            />
          </FormField>
          <FormField id="summary" label="Summary">
            <Textarea
              id="summary"
              value={vm.plan.summary}
              onChange={(e) => updatePlan("summary", e.target.value)}
              rows={4}
            />
          </FormField>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Daisy suggests
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {vm.plan.plainRequirements.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground">Pays </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(vm.plan.budgetAmount, vm.plan.currency)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {vm.plan.riskHint}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Proof: {vm.plan.deliverables.join(", ")}
            </p>
          </div>

          <div className="hidden gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => vm.setStage(0)}
            >
              Edit description
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={vm.busy || vm.published}
              onClick={() => setPublishOpen(true)}
            >
              Post work
            </Button>
          </div>
        </section>
      ) : null}

      {post.attached ? (
        <section className="surface-enter space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Posted</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Your Work Order is live in this demo. Open it to track evidence and
            payment.
          </p>
          {vm.draftId ? (
            <Button asChild className="min-h-11">
              <a href={`/work/${vm.draftId}`}>Open Work Order</a>
            </Button>
          ) : null}
        </section>
      ) : null}

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post this work?</DialogTitle>
            <DialogDescription>
              {vm.plan?.title ?? "Draft"} will go live. You can still review
              evidence before payment releases.
            </DialogDescription>
          </DialogHeader>
          {vm.plan ? (
            <p className="text-sm tabular-nums">
              {formatMoney(vm.plan.budgetAmount, vm.plan.currency)} ·{" "}
              {vm.plan.riskHint}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              Keep editing
            </Button>
            <Button
              disabled={vm.busy}
              onClick={() => {
                void vm.publish().then(() => setPublishOpen(false));
              }}
            >
              {vm.busy ? "Posting…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileStickyActions className="md:hidden">
        {vm.stage === 0 ? (
          <Button
            type="button"
            className="min-h-11 flex-1"
            disabled={!ready || vm.busy}
            onClick={() => void vm.prepareDraft()}
          >
            {vm.busy ? "Preparing…" : "Create draft"}
          </Button>
        ) : null}
        {vm.stage === 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => vm.setStage(0)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1"
              disabled={vm.busy || vm.published}
              onClick={() => setPublishOpen(true)}
            >
              Post work
            </Button>
          </>
        ) : null}
        {vm.stage === 2 && vm.draftId ? (
          <Button
            type="button"
            className="min-h-11 flex-1"
            onClick={() => router.push(`/work/${vm.draftId}`)}
          >
            Open Work Order
          </Button>
        ) : null}
      </MobileStickyActions>
    </AppPage>
  );
}

export function CreateWorkScreen() {
  const session = useAppSession();
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("q") ?? undefined;

  return (
    <CreateWorkRib.Provider
      deps={{
        services: session.services,
        requesterId: session.currentUser.id,
        initialMessage,
      }}
    >
      <CreateWorkView />
    </CreateWorkRib.Provider>
  );
}
