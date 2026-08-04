"use client";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentsPage() {
  return (
    <AppPage width="form" className="max-w-2xl">
      <PageHeader title="Payments" description="Payouts and job payments." />
      <EmptyState
        title="No payments yet"
        description="Protected payments appear here after you hire or get paid."
        action={
          <Button asChild variant="outline">
            <Link href="/work">View jobs</Link>
          </Button>
        }
      />
    </AppPage>
  );
}
