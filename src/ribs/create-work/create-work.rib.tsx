"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { cn } from "@/lib/utils";

const STAGES = ["Describe", "Match", "Done"] as const;

export function CreateWorkView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service");
  const preselectedProvider = searchParams.get("provider");

  const [stage, setStage] = useState(0);
  const [message, setMessage] = useState(searchParams.get("q")?.trim() ?? "");
  const [plan, setPlan] = useState<WorkPlan | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [doneKind, setDoneKind] = useState<"request" | "post" | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const planMutation = api.orchestrator.planAndDraft.useMutation();
  const updateMutation = api.orchestrator.updateDraft.useMutation();
  const publishMutation = api.work.publish.useMutation();
  const requestMutation = api.work.requestService.useMutation();
  const utils = api.useUtils();

  const matchQuery =
    plan != null
      ? `${plan.title} ${plan.summary} ${plan.category}`
      : message;

  const { data: matches = [], isFetching: matching } =
    api.services.match.useQuery(
      { query: matchQuery, limit: 8 },
      { enabled: stage === 1 && matchQuery.trim().length >= 3 },
    );

  const ready = message.trim().length >= 10;
  const busy =
    planMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    requestMutation.isPending;

  const prepareDraft = async () => {
    const toastId = toast.loading("Finding matches…");
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
      toast.success("Here’s your brief", {
        id: toastId,
        description: result.explanation,
      });
      void utils.work.list.invalidate();

      // Deep-link: request a specific service immediately after draft.
      if (preselectedService) {
        await requestService(preselectedService, result.draftId, result.plan);
      }
    } catch {
      toast.error("Could not prepare brief", { id: toastId });
    }
  };

  const savePlan = async (next: WorkPlan) => {
    setPlan(next);
    if (!draftId) return;
    await updateMutation.mutateAsync({ draftId, plan: next });
  };

  const updatePlan = <K extends keyof WorkPlan>(key: K, value: WorkPlan[K]) => {
    if (!plan) return;
    void savePlan({ ...plan, [key]: value });
  };

  const requestService = async (
    serviceListingId: string,
    id = draftId,
    p = plan,
  ) => {
    const toastId = toast.loading("Sending request…");
    try {
      if (id && p) {
        await updateMutation.mutateAsync({ draftId: id, plan: p });
      }
      const res = await requestMutation.mutateAsync({
        serviceListingId,
        draftId: id ?? undefined,
        title: p?.title,
        description: p?.summary,
        category: p?.category,
        budgetAmount: p?.budgetAmount,
      });
      setDoneKind("request");
      setDoneId(res.workOrderId);
      setStage(2);
      toast.success("Request sent", { id: toastId });
      void utils.work.list.invalidate();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Request failed",
        { id: toastId },
      );
    }
  };

  const publishOpenJob = async () => {
    if (!draftId) return;
    const toastId = toast.loading("Posting…");
    try {
      if (plan) {
        await updateMutation.mutateAsync({ draftId, plan });
      }
      await publishMutation.mutateAsync({ workOrderId: draftId });
      setDoneKind("post");
      setDoneId(draftId);
      setStage(2);
      setPublishOpen(false);
      toast.success("Job posted", { id: toastId });
      void utils.work.list.invalidate();
    } catch {
      toast.error("Publish failed", { id: toastId });
    }
  };

  return (
    <AppPage width="form" className="max-w-2xl space-y-8">
      <PageHeader
        title="What do you need?"
        description="Describe it. Daisy matches you with services — or you can post an open job."
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
          {preselectedService || preselectedProvider ? (
            <p className="text-xs text-muted-foreground">
              You’ll request a specific provider after Daisy drafts your brief.
            </p>
          ) : null}
          <Button
            type="button"
            className="min-h-11"
            disabled={!ready || busy}
            onClick={() => void prepareDraft()}
          >
            {busy ? "Working…" : "Find matches"}
          </Button>
        </section>
      ) : null}

      {stage === 1 && plan ? (
        <section className="space-y-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Your brief
            </p>
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
                rows={3}
              />
            </FormField>
            <p className="text-sm text-muted-foreground">
              Budget{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatMoney(plan.budgetAmount, plan.currency)}
              </span>{" "}
              · {plan.workMode.replaceAll("_", " ")}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium">Matched services</h2>
            {matching ? (
              <p className="text-sm text-muted-foreground">Matching…</p>
            ) : matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No packaged services matched yet. Post an open job so workers can
                apply.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void requestService(s.id)}
                      className={cn(
                        "flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-colors",
                        "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      <div className="relative aspect-video w-full bg-muted">
                        {s.coverImageUrl ? (
                          <Image
                            src={s.coverImageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="280px"
                          />
                        ) : null}
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.ownerName}
                        </p>
                        <p className="text-xs font-medium tabular-nums">
                          {formatMoney(s.priceCents, "USD")} · Request
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
              variant="ghost"
              disabled={busy || !draftId}
              onClick={() => setPublishOpen(true)}
            >
              Post as open job instead
            </Button>
          </div>
        </section>
      ) : null}

      {stage === 2 && doneId ? (
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">
            {doneKind === "request" ? "Request sent" : "Your job is live"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {doneKind === "request"
              ? "The provider was assigned. Track it under Requests."
              : "Workers can find it on the marketplace. Track it under Requests."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="min-h-11"
              onClick={() => router.push(`/work/${doneId}`)}
            >
              Open
            </Button>
            <Button asChild type="button" variant="outline" className="min-h-11">
              <Link href="/work">Requests</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post as an open job?</DialogTitle>
            <DialogDescription>
              Workers can browse and apply. Prefer requesting a matched service
              when one fits.
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
              onClick={() => void publishOpenJob()}
            >
              {busy ? "Posting…" : "Post publicly"}
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
