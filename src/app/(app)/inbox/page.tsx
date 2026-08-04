"use client";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InboxPage() {
  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader
        title="Inbox"
        description="Messages about your jobs will show up here."
      />
      <EmptyState
        title="No messages"
        description="When you post a job and people reply, conversations land here."
        action={
          <Button asChild variant="outline">
            <Link href="/create">Post a job</Link>
          </Button>
        }
      />
    </AppPage>
  );
}
