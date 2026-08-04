"use client";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";

/** Placeholder until submission review uses Neon-backed evidence. */
export function SubmissionReviewScreen({
  workOrderId: _workOrderId,
}: {
  workOrderId: string;
}) {
  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader title="Review" />
      <EmptyState
        title="Review coming soon"
        description="Submission review will connect to job deliverables next."
      />
    </AppPage>
  );
}
