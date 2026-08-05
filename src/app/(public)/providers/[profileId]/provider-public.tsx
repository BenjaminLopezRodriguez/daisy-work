"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Breadcrumbs } from "@/components/daisy/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

/**
 * §3.3: `Browse › Providers › {name}`. No `/providers` index exists yet
 * (design system §8), so the Providers crumb is plain text, not a dead link.
 */
const PROVIDER_TRAIL = [
  { label: "Browse", href: "/marketplace" },
  { label: "Providers" },
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
  const { data: services = [] } = api.services.listActive.useQuery({ limit: 48 });
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

      <PageHeader title={data.headline} description={data.name} />

      {theirs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Services</h2>
          <ul className="space-y-2">
            {theirs.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/services/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-muted/40"
                >
                  <span className="font-medium">{s.title}</span>
                  <span className="tabular-nums text-muted-foreground">
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
    </AppPage>
  );
}
