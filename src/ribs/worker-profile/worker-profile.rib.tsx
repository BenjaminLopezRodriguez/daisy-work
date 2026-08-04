"use client";

import { AppPage, PageHeader } from "@/components/daisy";
import { useAppSession } from "@/lib/daisy/session";

export function WorkerProfileScreen({ userId }: { userId?: string }) {
  const { currentUser } = useAppSession();
  const name =
    userId && userId !== currentUser.id ? "Worker" : currentUser.name;
  return (
    <AppPage width="form" className="max-w-xl space-y-4">
      <PageHeader title={name} description="Worker profile" />
      <p className="text-sm text-muted-foreground">
        Full profiles unlock after hiring is live.
      </p>
    </AppPage>
  );
}
