"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AppPage, EmptyState, PageHeader, ShareRow } from "@/components/daisy";
import { ReviewList, TrustBar } from "@/components/daisy/trust-bar";
import { Breadcrumbs } from "@/components/daisy/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

/** §3.3: `Browse › Providers › {name}`. Both ancestors are real routes now. */
const PROVIDER_TRAIL = [
  { label: "Browse", href: "/marketplace" },
  { label: "Providers", href: "/providers" },
];

/** Legacy provider page — prefer service listings; keep for profile deep links. */
export default function ProviderPublicPage({
  profileId,
}: {
  profileId: string;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = api.provider.byId.useQuery({
    id: profileId,
  });
  const { data: services = [] } = api.services.listActive.useQuery({
    limit: 48,
  });
  const recordView = api.provider.recordView.useMutation();

  const theirs = services.filter((s) => s.workerProfileId === profileId);

  useEffect(() => {
    if (!data?.id) return;
    recordView.mutate({ id: data.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (isLoading) {
    return (
      <AppPage width="form" className="max-w-2xl space-y-4">
        <Breadcrumbs trail={PROVIDER_TRAIL} page={null} />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </AppPage>
    );
  }

  if (isError || !data) {
    return (
      <AppPage width="form" className="max-w-2xl">
        <EmptyState
          title="Provider not found"
          description="This listing may have been removed."
          action={
            <Button asChild variant="outline">
              <Link href="/marketplace">Marketplace</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  return (
    <AppPage width="form" className="max-w-2xl space-y-6">
      <Breadcrumbs trail={PROVIDER_TRAIL} page={data.name} />

      {data.coverImageUrl ? (
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl">
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

      <PageHeader title={data.headline} description={data.name} />

      <TrustBar userId={data.userId} />
      <ShareRow title={`${data.name} · ${data.headline}`} />

      {theirs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Services</h2>
          <ul className="space-y-2">
            {theirs.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/services/${s.id}`}
                  className="border-border bg-card hover:bg-muted/40 flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
                >
                  <span className="font-medium">{s.title}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatMoney(s.priceCents, "USD")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Button
          className="min-h-11 w-full"
          onClick={() =>
            router.push(
              `/create?provider=${data.id}&q=${encodeURIComponent(data.headline)}`,
            )
          }
        >
          Request help from {data.name}
        </Button>
      )}

      <ReviewList userId={data.userId} />
    </AppPage>
  );
}
