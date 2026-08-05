"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppPage, FormField, PageHeader } from "@/components/daisy";
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

/**
 * A signed-out visitor's own draft, parked across the Google sign-in redirect.
 * Plan only — never tokens.
 */
const PENDING_KEY = "daisy.create.pending";
type PendingSave = { plan: WorkPlan; serviceListingId?: string };

function readPending(): PendingSave | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingSave) : null;
  } catch {
    return null;
  }
}

export function CreateWorkView({ signedIn }: { signedIn: boolean }) {
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
  const previewMutation = api.orchestrator.planPreview.useMutation();
  const createMutation = api.orchestrator.createFromPlan.useMutation();
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
    previewMutation.isPending ||
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    requestMutation.isPending;

  /** Park the draft, then go get an account. Sign-in is the save step. */
  const saveAndSignIn = (pending: PendingSave) => {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {
      // Storage blocked — sign-in still works, the draft just won't survive.
    }
    router.push("/signin?next=/create");
  };

  const prepareDraft = async () => {
    const toastId = toast.loading("Finding matches…");
    try {
      const result = signedIn
        ? await planMutation.mutateAsync({ message })
        : await previewMutation.mutateAsync({ message });
      // The planner always drafts now; it never sends questions back. Kept as a
      // guard so an old response shape can't leave the user on a dead screen.
      if (result.kind === "ask_user") {
        toast.error("Could not write that up", {
          id: toastId,
          description: "Try describing it once more.",
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
      const newDraftId =
        "draftId" in result && typeof result.draftId === "string"
          ? result.draftId
          : null;
      setPlan(result.plan);
      setDraftId(newDraftId);
      setStage(1);
      toast.success("Here’s your brief", {
        id: toastId,
        description: result.explanation,
      });
      if (signedIn) void utils.work.list.invalidate();

      // Deep-link: request a specific service immediately after draft.
      if (preselectedService) {
        await requestService(preselectedService, newDraftId, result.plan);
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
    if (!signedIn) {
      if (p) saveAndSignIn({ plan: p, serviceListingId });
      return;
    }
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

  /**
   * Back from sign-in with a parked draft: persist it and drop them on it.
   * Kept in storage until the save succeeds so a failure never eats the draft.
   */
  const resumeSave = async (pending: PendingSave) => {
    const toastId = toast.loading("Saving your draft…");
    try {
      const { draftId: id } = await createMutation.mutateAsync({
        plan: pending.plan,
      });
      sessionStorage.removeItem(PENDING_KEY);
      setDraftId(id);
      void utils.work.list.invalidate();
      if (pending.serviceListingId) {
        toast.dismiss(toastId);
        await requestService(pending.serviceListingId, id, pending.plan);
        return;
      }
      toast.success("Draft saved", { id: toastId });
      router.push(`/work/${id}`);
    } catch {
      toast.error("Couldn’t save your draft", {
        id: toastId,
        description: "It’s still here. Post again to retry.",
      });
    }
  };

  const resumed = useRef(false);
  useEffect(() => {
    if (!signedIn || resumed.current) return;
    const pending = readPending();
    if (!pending) return;
    resumed.current = true;
    setPlan(pending.plan);
    setStage(1);
    void resumeSave(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const publishOpenJob = async () => {
    if (!signedIn) {
      if (plan) saveAndSignIn({ plan });
      setPublishOpen(false);
      return;
    }
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
        description="Describe it. Daisy finds matching services, or you can post an open job."
      />

      {stage === 0 ? (
        <section className="space-y-4">
          {/* Single field, so no asterisk and no helper row: the placeholder
              already shows the expected shape. */}
          <FormField id="need" label="What do you need done?">
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
            {busy ? "Writing it up…" : "Send request"}
          </Button>
        </section>
      ) : null}

      {stage === 1 && plan ? (
        <section className="space-y-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <FormField id="title" label="Title">
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

          {!signedIn ? (
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
              {busy
                ? "Working…"
                : "Not saved yet. You sign in when you post."}
            </p>
          ) : null}

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
              disabled={busy || (signedIn && !draftId)}
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
              {busy ? "Posting…" : signedIn ? "Post publicly" : "Sign in & post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}

export function CreateWorkScreen({ signedIn }: { signedIn: boolean }) {
  return <CreateWorkView signedIn={signedIn} />;
}
