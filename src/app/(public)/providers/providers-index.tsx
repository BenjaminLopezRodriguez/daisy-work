"use client";

import Link from "next/link";
import Image from "next/image";

import { AppPage, EmptyState, PageHeader } from "@/components/daisy";
import { Breadcrumbs } from "@/components/daisy/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/domain";
import { api } from "@/trpc/react";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

/**
 * The directory the provider detail page always needed. Without it every
 * profile was an orphan reachable only by a link somebody pasted.
 */
export default function ProvidersIndex() {
  const { data, isPending } = api.provider.listPublic.useQuery({ limit: 48 });

  return (
    <AppPage className="space-y-6">
      <Breadcrumbs
        trail={[{ label: "Browse", href: "/marketplace" }]}
        page="Providers"
      />

      <PageHeader
        title="Providers"
        description="People offering services on Daisy.work."
      />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          title="No providers yet"
          description="Nobody has published a profile. If you offer a service, you can be the first."
          action={
            <Button asChild>
              <Link href="/onboarding/provider">Create a profile</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <li key={p.id}>
              <Link
                href={`/providers/${p.id}`}
                className="border-border bg-card hover:bg-muted/40 focus-visible:ring-ring block h-full overflow-hidden rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {p.coverImageUrl ? (
                  <div className="bg-muted relative aspect-[16/6] w-full">
                    <Image
                      src={p.coverImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
                    />
                  </div>
                ) : null}
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 shrink-0">
                      {p.avatar ? <AvatarImage src={p.avatar} alt="" /> : null}
                      <AvatarFallback className="text-xs">
                        {initialsOf(p.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.name}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium">
                    {p.headline}
                  </p>
                  <p className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                    {p.location ? <span>{p.location}</span> : null}
                    {p.hourlyRate ? (
                      <span className="tabular-nums">
                        {formatMoney(p.hourlyRate, "USD")}/hr
                      </span>
                    ) : null}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
