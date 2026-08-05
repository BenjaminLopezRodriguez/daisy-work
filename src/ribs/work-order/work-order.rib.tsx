"use client";

import { useState } from "react";
import Link from "next/link";

import {
  AppPage,
  EmptyState,
  PageHeader,
  WorkStatusBadge,
} from "@/components/daisy";
import {
  DocumentUpload,
  type UploadedDoc,
} from "@/components/daisy/uploads/document-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

export function WorkOrderScreen({ workOrderId }: { workOrderId: string }) {
  const { data: wo, isLoading, isError } = api.work.byId.useQuery({
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

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <WorkStatusBadge status={wo.status} />
        <span className="tabular-nums">
          {formatMoney(wo.budgetAmount, wo.currency)}
        </span>
        <span className="capitalize">{wo.workMode.replaceAll("_", " ")}</span>
        <span>{wo.category}</span>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 text-sm">
        <h2 className="font-medium">Details</h2>
        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
          {wo.description}
        </p>
      </section>

      <ApplySection workOrderId={wo.id} requesterId={wo.requesterId} />
      <DeliverableSection workOrderId={wo.id} />
    </AppPage>
  );
}

/**
 * Poster sees applicants. Signed-in worker sees one Apply button.
 * Signed-out visitor sees a sign-in prompt. tRPC only — no server imports.
 */
function ApplySection({
  workOrderId,
  requesterId,
}: {
  workOrderId: string;
  requesterId: string;
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
            <Link href="/api/auth/signin">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (mine.data.userId === requesterId) {
    return <ApplicantList workOrderId={workOrderId} />;
  }

  const applied = mine.data.applications.some(
    (a) => a.workOrderId === workOrderId,
  );

  return <ApplyButton workOrderId={workOrderId} applied={applied} />;
}

function ApplyButton({
  workOrderId,
  applied,
}: {
  workOrderId: string;
  applied: boolean;
}) {
  const utils = api.useUtils();
  const apply = api.application.submit.useMutation({
    onSuccess: () => utils.application.mine.invalidate(),
  });
  const done = applied || apply.isSuccess;

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={done || apply.isPending}
        onClick={() => apply.mutate({ workOrderId })}
      >
        {done ? "Applied" : apply.isPending ? "Applying…" : "Apply"}
      </Button>
      {apply.error ? (
        <p className="text-sm text-destructive">{apply.error.message}</p>
      ) : null}
    </div>
  );
}

function ApplicantList({ workOrderId }: { workOrderId: string }) {
  const { data, isLoading } = api.application.listForJob.useQuery(
    { workOrderId },
    { retry: false },
  );

  if (isLoading) return <Skeleton className="h-16 rounded-xl" />;
  if (!data?.length) {
    return (
      <EmptyState
        title="No applicants yet"
        description="You'll see people here as they apply to your job."
      />
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 text-sm">
      <h2 className="font-medium">
        Applicants <span className="text-muted-foreground">({data.length})</span>
      </h2>
      <ul className="mt-3 space-y-3">
        {data.map((a) => (
          <li key={a.id} className="space-y-1">
            <p className="font-medium">{a.applicantName}</p>
            {a.message ? (
              <p className="text-muted-foreground">{a.message}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeliverableSection({ workOrderId }: { workOrderId: string }) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const submit = api.work.submitEvidence.useMutation({
    onSuccess: () => setDocs([]),
  });

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium">Submit deliverables</h2>
      <p className="text-xs text-muted-foreground">
        Upload photos or documents for this job.
      </p>
      <DocumentUpload value={docs} onChange={setDocs} label="Files" />
      <Button
        type="button"
        className="min-h-10"
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
      {submit.isSuccess ? (
        <p className="text-sm text-muted-foreground">Files submitted.</p>
      ) : null}
      {submit.error ? (
        <p className="text-sm text-destructive">{submit.error.message}</p>
      ) : null}
    </section>
  );
}
