"use client";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";

export default function OrganizationPage() {
  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader
        title="Organization"
        description="Team billing and shared jobs."
      />
      <EmptyState
        title="No organization"
        description="You’re on an individual account. Org tools will unlock when you create one."
      />
    </AppPage>
  );
}
