"use client";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";

export default function ReviewPage() {
  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader
        title="Review"
        description="Submission review opens from a job when work is delivered."
      />
      <EmptyState
        title="Nothing to review"
        description="Open a submitted job from Work to review deliverables."
      />
    </AppPage>
  );
}
