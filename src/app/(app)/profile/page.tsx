"use client";

import { AppPage, PageHeader } from "@/components/daisy";
import { useAppSession } from "@/lib/daisy/session";

export default function ProfilePage() {
  const { currentUser } = useAppSession();
  return (
    <AppPage width="form" className="max-w-xl space-y-4">
      <PageHeader title="Profile" description={currentUser.email} />
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{currentUser.name}</p>
        <p className="mt-1 text-muted-foreground capitalize">
          {currentUser.accountType} · {currentUser.identityStatus}
        </p>
      </div>
    </AppPage>
  );
}
