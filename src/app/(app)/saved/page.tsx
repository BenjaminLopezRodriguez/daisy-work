"use client";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SavedPage() {
  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader title="Saved" description="Jobs and people you bookmarked." />
      <EmptyState
        title="Nothing saved"
        description="Save jobs from Work when you want to come back later."
        action={
          <Button asChild variant="outline">
            <Link href="/work">Browse jobs</Link>
          </Button>
        }
      />
    </AppPage>
  );
}
