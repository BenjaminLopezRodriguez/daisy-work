"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

export default function ServicePublicView({
  serviceId,
}: {
  serviceId: string;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = api.services.byId.useQuery({
    id: serviceId,
  });
  const recordView = api.services.recordView.useMutation();
  const request = api.work.requestService.useMutation({
    onSuccess: (res) => router.push(`/work/${res.workOrderId}`),
  });

  useEffect(() => {
    if (!data?.id) return;
    recordView.mutate({ id: data.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (isLoading) {
    return (
      <AppPage width="form" className="max-w-2xl space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-10 w-2/3" />
      </AppPage>
    );
  }

  if (isError || !data) {
    return (
      <AppPage width="form" className="max-w-2xl">
        <EmptyState
          title="Service not found"
          description="This listing may have been removed."
          action={
            <Button asChild variant="outline">
              <Link href="/marketplace">Back to marketplace</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  return (
    <AppPage width="form" className="max-w-2xl space-y-6">
      {data.coverImageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={data.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="672px"
            priority
          />
        </div>
      ) : null}

      <PageHeader
        title={data.title}
        description={data.ownerName ?? "Provider"}
        actions={
          <Button asChild variant="outline">
            <Link href="/marketplace">Marketplace</Link>
          </Button>
        }
      />

      <p className="text-lg font-semibold tabular-nums">
        {formatMoney(data.priceCents, "USD")}
      </p>

      {data.description ? (
        <section className="rounded-xl border border-border bg-card p-4 text-sm">
          <h2 className="font-medium">What’s included</h2>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
            {data.description}
          </p>
        </section>
      ) : null}

      {data.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-3 py-1 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <Button
        className="min-h-11 w-full"
        disabled={request.isPending}
        onClick={() =>
          request.mutate({
            serviceListingId: data.id,
            title: `Request: ${data.title}`,
            description: data.description,
            budgetAmount: data.priceCents,
          })
        }
      >
        {request.isPending ? "Sending…" : "Request this service"}
      </Button>
      {request.error ? (
        <p className="text-sm text-destructive">{request.error.message}</p>
      ) : null}
    </AppPage>
  );
}
