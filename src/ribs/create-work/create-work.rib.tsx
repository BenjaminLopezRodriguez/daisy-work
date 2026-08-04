"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  AppPage,
  FormField,
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
import type { WorkPlan } from "@/server/orchestrator/orchestrator.types";
import { api } from "@/trpc/react";

const STAGES = ["Describe", "Review", "Post"] as const;

export function CreateWorkView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState(0);
  const [message, setMessage] = useState(searchParams.get("q")?.trim() ?? "");
  const [plan, setPlan] = useState<WorkPlan | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const planMutation = api.orchestrator.planAndDraft.useMutation();
  const updateMutation = api.orchestrator.updateDraft.useMutation();
  const publishMutation = api.work.publish.useMutation();
  const utils = api.useUtils();

  const ready = message.trim().length >= 10;
  const busy =
    planMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending;

  useEffect(() => {
    if (!plan && stage === 0) return;
  }, [plan, stage]);

  const prepareDraft = async () => {
    const toastId = toast.loading("Preparing draft…");
    try {
      const result = await planMutation.mutateAsync({ message });
      if (result.kind === "ask_user") {
        toast.message("Need a bit more", {
          id: toastId,
          description: result.question,
        });
        return;
      }
      if (result.kind === "unavailable") {
        toast.error("Unavailable", {
          id: toastId,
          description: result.message,
        });
        return;
      }
      setPlan(result.plan);
      setDraftId(result.draftId);
      setStage(1);
      toast.success("Draft ready", {
        id: toastId,
        description: result.explanation,
      });
      void utils.work.list.invalidate();
    } catch {
      toast.error("Could not prepare draft", { id: toastId });
    }
  };

  const savePlan = async (next: WorkPlan) => {
    setPlan(next);
    if (!draftId) return;
    await updateMutation.mutateAsync({ draftId, plan: next });
  };

  const publish = async () => {
    if (!draftId) return;
    const toastId = toast.loading("Publishing…");
    try {
      if (plan) {
        await updateMutation.mutateAsync({ draftId, plan });
      }
      await publishMutation.mutateAsync({ workOrderId: draftId });
      setStage(2);
      setPublishOpen(false);
      toast.success("Job posted", { id: toastId });
      void utils.work.list.invalidate();
    } catch {
      toast.error("Publish failed", { id: toastId });
    }
  };

  const updatePlan = <K extends keyof WorkPlan>(key: K, value: WorkPlan[K]) => {
    if (!plan) return;
    void savePlan({ ...plan, [key]: value });
  };

  return (
    <AppPage width="form" className="max-w-2xl space-y-8">
      <PageHeader
        title="Post a job"
        description="Say what you need. Daisy drafts the listing."
      />

      <StepProgress steps={[...STAGES]} currentIndex={stage} />

      {stage === 0 ? (
        <section className="space-y-4">
          <FormField
            id="need"
            label="What do you need done?"
            required
            helper="One or two sentences is enough."
          >
            <Textarea
              id="need"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Need a plumber to replace a kitchen faucet this week…"
              className="min-h-36 text-base"
            />
          </FormField>
          <Button
            type="button"
            className="min-h-11"
            disabled={!ready || busy}
            onClick={() => void prepareDraft()}
          >
            {busy ? "Preparing…" : "Continue"}
          </Button>
        </section>
      ) : null}

      {stage === 1 && plan ? (
        <section className="space-y-4">
          <FormField id="title" label="Title" required>
            <Input
              id="title"
              value={plan.title}
              onChange={(e) => updatePlan("title", e.target.value)}
            />
          </FormField>
          <FormField id="summary" label="Description">
            <Textarea
              id="summary"
              value={plan.summary}
              onChange={(e) => updatePlan("summary", e.target.value)}
              rows={4}
            />
          </FormField>

          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Suggested
            </p>
            <ul className="mt-2 space-y-1.5">
              {plan.plainRequirements.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="mt-3 text-muted-foreground">
              Budget{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatMoney(plan.budgetAmount, plan.currency)}
              </span>{" "}
              · {plan.workMode.replaceAll("_", " ")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage(0)}
              disabled={busy}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={busy || !draftId}
              onClick={() => setPublishOpen(true)}
            >
              Post job
            </Button>
          </div>
        </section>
      ) : null}

      {stage === 2 && draftId ? (
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Your job is live</h2>
          <p className="text-sm text-muted-foreground">
            Workers can find it on Work. You can open it anytime.
          </p>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => router.push(`/work/${draftId}`)}
          >
            Open job
          </Button>
        </section>
      ) : null}

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post this job?</DialogTitle>
            <DialogDescription>
              It will show up in Work for people to find.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPublishOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void publish()}
            >
              {busy ? "Posting…" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}

export function CreateWorkScreen() {
  return <CreateWorkView />;
}
