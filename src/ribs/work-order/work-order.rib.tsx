"use client";

import Link from "next/link";

import {
  AppPage,
  EmptyState,
  PageHeader,
  WorkStatusBadge,
} from "@/components/daisy";
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
    </AppPage>
  );
}
