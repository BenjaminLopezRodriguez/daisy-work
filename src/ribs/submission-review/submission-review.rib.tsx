"use client";

import { useState } from "react";
import { createRib, useRibLifecycle } from "nextjs-ribs";
import { useRouter } from "next/navigation";

import {
  ActionCluster,
  ActionStatusBanner,
  EvidencePreview,
  PageHeader,
  SectionHeading,
  VerificationBadge,
  type ActionStatus,
} from "@/components/daisy";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppSession } from "@/lib/daisy/session";
import {
  seedEvidence,
  seedSubmissions,
  STOREFRONT_WO_ID,
} from "@/server/mocks/seed";
import type { DaisyServices } from "@/server/services";

export const SubmissionReviewRib = createRib({
  name: "SubmissionReview",
  interactor: (deps: {
    services: DaisyServices;
    workOrderId: string;
  }) => {
    const [decision, setDecision] = useState<string | null>(null);
    const [recommendation, setRecommendation] = useState<string>("");
    const [actionStatus, setActionStatus] =
      useState<ActionStatus>("loading");
    const [statusMessage, setStatusMessage] = useState<string | null>(
      "Loading agent recommendation…",
    );

    useRibLifecycle({
      onAttach: () => {
        const sub =
          seedSubmissions.find((s) => s.workOrderId === deps.workOrderId) ??
          seedSubmissions[0];
        if (!sub) {
          setActionStatus("needs_attention");
          setStatusMessage("No submission found for this Work Order.");
          return;
        }
        void deps.services.governance
          .evaluateSubmission({
            workOrderId: deps.workOrderId,
            submissionId: sub.id,
          })
          .then((result) => {
            setRecommendation(result.explanation);
            setActionStatus("idle");
            setStatusMessage(null);
          })
          .catch(() => {
            setActionStatus("failed");
            setStatusMessage("Could not load recommendation. You can still decide.");
          });
      },
    });

    const approve = async () => {
      setActionStatus("saving");
      setStatusMessage("Recording approval…");
      try {
        await deps.services.workOrders.approve({
          workOrderId: deps.workOrderId,
        });
        setDecision("approved");
        setActionStatus("succeeded");
        setStatusMessage(
          "Approved (mocked). Authorized payment would release — no real funds moved.",
        );
      } catch {
        setActionStatus("failed");
        setStatusMessage("Approval failed. Nothing was changed.");
      }
    };

    return {
      workOrderId: deps.workOrderId,
      decision,
      recommendation,
      actionStatus,
      statusMessage,
      busy: actionStatus === "loading" || actionStatus === "saving",
      approve,
      requestChanges: () => {
        setDecision("changes_requested");
        setActionStatus("succeeded");
        setStatusMessage("Changes requested (mocked). Worker would be notified.");
      },
      escalate: () => {
        setDecision("escalated");
        setActionStatus("needs_attention");
        setStatusMessage("Escalated for human review (mocked).");
      },
      dispute: () => {
        setDecision("disputed");
        setActionStatus("needs_attention");
        setStatusMessage(
          "Dispute opened (mocked). Agents may assist but do not decide.",
        );
      },
    };
  },
  presenter: (state) => state,
});

export function SubmissionReviewView() {
  const vm = SubmissionReviewRib.useViewModel();
  const router = useRouter();
  const subs = seedSubmissions.filter(
    (s) =>
      s.workOrderId === vm.workOrderId ||
      (vm.workOrderId === STOREFRONT_WO_ID &&
        s.workOrderId === STOREFRONT_WO_ID),
  );
  const evidence = seedEvidence.filter((e) =>
    subs.some((s) => s.id === e.submissionId),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review submission"
        description="Check evidence, then approve payment, ask for changes, escalate, or open a dispute."
      />

      <ActionStatusBanner
        status={vm.actionStatus}
        message={vm.statusMessage ?? undefined}
      />

      <section className="space-y-3">
        <SectionHeading title="Evidence" />
        <div className="grid gap-3 sm:grid-cols-2">
          {evidence.map((e) => (
            <EvidencePreview key={e.id} evidence={e} />
          ))}
        </div>
      </section>

      <aside className="border border-border bg-muted/40 p-4 text-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="font-medium">Agent recommendation</p>
          <VerificationBadge />
        </div>
        <p className="text-muted-foreground text-pretty">
          {vm.recommendation || "Waiting for recommendation…"}
        </p>
      </aside>

      {!vm.decision ? (
        <ActionCluster
          primary={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={vm.busy}>Approve and release payment</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Approve and release payment?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Approving marks this Work Order approved in the mock store
                    and would release authorized payment. In this build, no real
                    funds move.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep reviewing</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      void vm.approve().then(() => {
                        router.push(`/work/${vm.workOrderId}`);
                      });
                    }}
                  >
                    Confirm approval
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
          secondary={
            <Button
              variant="outline"
              disabled={vm.busy}
              onClick={vm.requestChanges}
            >
              Request changes
            </Button>
          }
          tertiary={
            <Button variant="ghost" disabled={vm.busy} onClick={vm.escalate}>
              Escalate for review
            </Button>
          }
          destructive={
            <Button
              variant="destructive"
              disabled={vm.busy}
              onClick={vm.dispute}
            >
              Open dispute
            </Button>
          }
        />
      ) : (
        <ActionCluster
          primary={
            <Button asChild>
              <a href={`/work/${vm.workOrderId}`}>Back to Work Order</a>
            </Button>
          }
        />
      )}
    </div>
  );
}

export function SubmissionReviewScreen({
  workOrderId,
}: {
  workOrderId: string;
}) {
  const session = useAppSession();
  return (
    <SubmissionReviewRib.Provider
      deps={{ services: session.services, workOrderId }}
    >
      <SubmissionReviewView />
    </SubmissionReviewRib.Provider>
  );
}
