"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type Placement = "landing" | "marketplace" | "work_feed";

export function AdSlot({
  placement,
  className,
  title = "Sponsored",
}: {
  placement: Placement;
  className?: string;
  title?: string;
}) {
  const { data: ads = [], isLoading } = api.ads.listActive.useQuery({
    placement,
    limit: 3,
  });
  const recordImpressions = api.ads.recordImpressions.useMutation();
  const recordClick = api.ads.recordClick.useMutation();
  const tracked = useRef<string>("");

  useEffect(() => {
    if (ads.length === 0) return;
    const key = ads.map((a) => a.id).join(",");
    if (tracked.current === key) return;
    tracked.current = key;
    recordImpressions.mutate({ ids: ads.map((a) => a.id) });
    // Intentionally omit mutate from deps — fire once per ad set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads]);

  if (isLoading) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => (
          <li key={ad.id}>
            <Link
              href={ad.ctaUrl}
              target={ad.ctaUrl.startsWith("http") ? "_blank" : undefined}
              rel={
                ad.ctaUrl.startsWith("http") ? "noopener noreferrer" : undefined
              }
              onClick={() => recordClick.mutate({ id: ad.id })}
              className={cn(
                "border-border bg-card flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-colors outline-none",
                "hover:bg-muted/40 focus-visible:ring-ring focus-visible:ring-2",
              )}
            >
              {ad.imageUrl ? (
                <div className="bg-muted relative aspect-video w-full">
                  <Image
                    src={ad.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                    {ad.advertiserType === "company"
                      ? (ad.companyName ?? "Partner")
                      : "Worker promo"}
                  </span>
                  <span className="text-muted-foreground text-[10px]">Ad</span>
                </div>
                <h3 className="text-sm font-semibold tracking-tight">
                  {ad.headline}
                </h3>
                {ad.body ? (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {ad.body}
                  </p>
                ) : null}
                <span className="text-primary mt-auto text-xs font-medium">
                  {ad.ctaLabel} →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
