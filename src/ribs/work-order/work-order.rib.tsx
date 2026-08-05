"use client";

import { useState } from "react";
import Link from "next/link";

import {
  AppPage,
  EmptyState,
  PageHeader,
  ShareRow,
  WorkStatusBadge,
} from "@/components/daisy";
import {
  DocumentUpload,
  type UploadedDoc,
} from "@/components/daisy/uploads/document-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export function WorkOrderScreen({ workOrderId }: { workOrderId: string }) {
  const {
    data: wo,
    isLoading,
    isError,
  } = api.work.byId.useQuery({
    id: workOrderId,
  });

  if (isLoading) {
    return (
      <AppPage width="form" className="max-w-2xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 rounded-xl" />
      </AppPage>
    );
  }

  if (isError || !wo) {
    return (
      <AppPage width="form" className="max-w-2xl">
        <EmptyState
          title="Job not found"
          description="It may have been removed or the link is wrong."
          action={
            <Button asChild variant="outline">
              <Link href="/work">Back to Work</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  return (
    <AppPage width="form" className="max-w-2xl space-y-6">
      <PageHeader
        title={wo.title}
        description={wo.description}
        actions={
          <Button asChild variant="outline">
            <Link href="/work">All jobs</Link>
          </Button>
        }
      />

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <WorkStatusBadge status={wo.status} />
        <span className="tabular-nums">
          {formatMoney(wo.budgetAmount, wo.currency)}
        </span>
        <span className="capitalize">{wo.workMode.replaceAll("_", " ")}</span>
        <span>{wo.category}</span>
      </div>

      <section className="border-border bg-card rounded-xl border p-4 text-sm">
        <h2 className="font-medium">Details</h2>
        <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
          {wo.description}
        </p>
      </section>

      <ShareRow title={wo.title} />

      <ApplySection
        workOrderId={wo.id}
        requesterId={wo.requesterId}
        assigneeId={wo.assigneeId ?? null}
        status={wo.status}
      />
    </AppPage>
  );
}

/**
 * The whole job in one place, branched by who is looking. Before this, a job
 * could be applied to and never resolved — there was no accept and no approve.
 */
function ApplySection({
  workOrderId,
  requesterId,
  assigneeId,
  status,
}: {
  workOrderId: string;
  requesterId: string;
  assigneeId: string | null;
  status: string;
}) {
  const mine = api.application.mine.useQuery(undefined, { retry: false });

  if (mine.isLoading) return <Skeleton className="h-16 rounded-xl" />;

  // Unauthenticated: `mine` is a protected procedure and errors out.
  if (mine.isError || !mine.data) {
    return (
      <EmptyState
        title="Sign in to apply"
        description="You need an account to apply for this job."
        action={
          <Button asChild>
            <Link href="/signin">Sign in</Link>
          </Button>
        }
      />
    );
  }

  const me = mine.data.userId;
  const isOwner = me === requesterId;
  const isAssignee = me === assigneeId;
  const done = status === "approved";

  return (
    <>
      {isOwner ? (
        <ApplicantList
          workOrderId={workOrderId}
          assigneeId={assigneeId}
          status={status}
        />
      ) : isAssignee ? (
        <DeliverableSection workOrderId={workOrderId} status={status} />
      ) : (
        <ApplyButton
          workOrderId={workOrderId}
          applied={mine.data.applications.some(
            (a) => a.workOrderId === workOrderId,
          )}
          closed={Boolean(assigneeId)}
        />
      )}

      {done && (isOwner || isAssignee) ? (
        <ReviewSection workOrderId={workOrderId} />
      ) : null}
    </>
  );
}

function ApplyButton({
  workOrderId,
  applied,
  closed,
}: {
  workOrderId: string;
  applied: boolean;
  closed: boolean;
}) {
  const utils = api.useUtils();
  const apply = api.application.submit.useMutation({
    onSuccess: () => utils.application.mine.invalidate(),
  });
  const done = applied || apply.isSuccess;

  if (closed && !done) {
    return (
      <EmptyState
        title="This job is taken"
        description="Someone has already been assigned. Browse what else is open."
        action={
          <Button asChild variant="outline">
            <Link href="/marketplace">Browse jobs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="min-h-11 w-full"
        disabled={done || apply.isPending}
        onClick={() => apply.mutate({ workOrderId })}
      >
        {done ? "Applied" : apply.isPending ? "Applying…" : "Apply"}
      </Button>
      {done ? (
        <p className="text-muted-foreground text-center text-sm">
          You&rsquo;ll get a notification if the customer picks you.
        </p>
      ) : null}
      {apply.error ? (
        <p className="text-destructive text-sm">{apply.error.message}</p>
      ) : null}
    </div>
  );
}

/** The owner's side: pick someone, then sign off when the work lands. */
function ApplicantList({
  workOrderId,
  assigneeId,
  status,
}: {
  workOrderId: string;
  assigneeId: string | null;
  status: string;
}) {
  const utils = api.useUtils();
  const { data, isLoading } = api.application.listForJob.useQuery(
    { workOrderId },
    { retry: false },
  );
  const accept = api.application.accept.useMutation({
    onSuccess: async () => {
      await utils.work.byId.invalidate({ id: workOrderId });
      await utils.application.listForJob.invalidate({ workOrderId });
    },
  });
  const approve = api.work.approve.useMutation({
    onSuccess: () => utils.work.byId.invalidate({ id: workOrderId }),
  });

  if (isLoading) return <Skeleton className="h-16 rounded-xl" />;

  return (
    <section className="space-y-4">
      {status === "submitted" ? (
        <div className="border-border bg-card space-y-3 rounded-xl border p-4">
          <div>
            <h2 className="text-sm font-medium">Work submitted for review</h2>
            <p className="text-muted-foreground text-xs">
              Approving closes the job and lets you both leave a review.
            </p>
          </div>
          <Button
            className="min-h-11 w-full sm:w-auto"
            disabled={approve.isPending}
            onClick={() => approve.mutate({ workOrderId })}
          >
            {approve.isPending ? "Approving…" : "Approve work"}
          </Button>
          {approve.error ? (
            <p className="text-destructive text-sm">{approve.error.message}</p>
          ) : null}
        </div>
      ) : null}

      {!data?.length ? (
        <EmptyState
          title="No applicants yet"
          description="You'll see people here as they apply to your job."
        />
      ) : (
        <div className="border-border bg-card rounded-xl border p-4 text-sm">
          <h2 className="font-medium">
            Applicants{" "}
            <span className="text-muted-foreground">({data.length})</span>
          </h2>
          <ul className="divide-border mt-3 divide-y">
            {data.map((a) => {
              const chosen = a.applicantId === assigneeId;
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{a.applicantName}</p>
                    {a.message ? (
                      <p className="text-muted-foreground">{a.message}</p>
                    ) : null}
                  </div>
                  {chosen ? (
                    <span className="text-nav-active shrink-0 text-xs font-medium">
                      Hired
                    </span>
                  ) : assigneeId ? null : (
                    <Button
                      size="sm"
                      className="min-h-11 shrink-0 sm:min-h-9"
                      disabled={accept.isPending}
                      onClick={() => accept.mutate({ applicationId: a.id })}
                    >
                      {accept.isPending ? "Hiring…" : "Hire"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {accept.error ? (
            <p className="text-destructive mt-2 text-sm">
              {accept.error.message}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** The assignee's side. Uploading the files IS submitting them. */
function DeliverableSection({
  workOrderId,
  status,
}: {
  workOrderId: string;
  status: string;
}) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const utils = api.useUtils();
  const submit = api.work.submitEvidence.useMutation({
    onSuccess: async () => {
      setDocs([]);
      await utils.work.byId.invalidate({ id: workOrderId });
    },
  });

  if (status === "approved") {
    return (
      <EmptyState
        title="Approved"
        description="The customer approved your work. Nice one."
      />
    );
  }

  return (
    <section className="border-border bg-card space-y-3 rounded-xl border p-4">
      <h2 className="text-sm font-medium">
        {status === "submitted" ? "Add more files" : "Submit your work"}
      </h2>
      <p className="text-muted-foreground text-xs">
        {status === "submitted"
          ? "Waiting on the customer to approve."
          : "Upload photos or documents. Uploading notifies the customer to review."}
      </p>
      <DocumentUpload value={docs} onChange={setDocs} label="Files" />
      <Button
        type="button"
        className="min-h-11"
        disabled={docs.length === 0 || submit.isPending}
        onClick={() =>
          submit.mutate({
            workOrderId,
            files: docs.map((d) => ({
              url: d.url,
              name: d.name,
              key: d.key,
            })),
          })
        }
      >
        {submit.isPending ? "Submitting…" : "Submit files"}
      </Button>
      {submit.error ? (
        <p className="text-destructive text-sm">{submit.error.message}</p>
      ) : null}
    </section>
  );
}

/** Both sides rate each other once the job is approved. */
function ReviewSection({ workOrderId }: { workOrderId: string }) {
  const utils = api.useUtils();
  const existing = api.review.mineForJob.useQuery({ workOrderId });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const submit = api.review.submit.useMutation({
    onSuccess: () => utils.review.mineForJob.invalidate({ workOrderId }),
  });

  if (existing.isLoading) return <Skeleton className="h-24 rounded-xl" />;
  if (existing.data?.mine) {
    return (
      <p className="text-muted-foreground text-sm">
        You rated this job {existing.data.mine.rating} out of 5.
      </p>
    );
  }

  return (
    <section className="border-border bg-card space-y-3 rounded-xl border p-4">
      <h2 className="text-sm font-medium">How did it go?</h2>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className={cn(
              "focus-visible:ring-ring flex size-11 items-center justify-center rounded-md text-xl focus-visible:ring-2 focus-visible:outline-none",
              n <= rating ? "text-nav-active" : "text-muted-foreground",
            )}
          >
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What should other people know? (optional)"
        aria-label="Review comment"
      />
      <Button
        type="button"
        className="min-h-11"
        disabled={submit.isPending}
        onClick={() => submit.mutate({ workOrderId, rating, comment })}
      >
        {submit.isPending ? "Posting…" : "Post review"}
      </Button>
      {submit.error ? (
        <p className="text-destructive text-sm">{submit.error.message}</p>
      ) : null}
    </section>
  );
}
