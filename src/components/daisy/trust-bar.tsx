"use client";

import { formatDistanceToNow } from "date-fns";

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

/**
 * The three numbers a stranger checks before paying someone: has anyone else
 * used them, what did those people say, and how long have they been here.
 */
export function TrustBar({ userId }: { userId: string }) {
  const { data, isPending } = api.provider.trustStats.useQuery({ userId });

  if (isPending) return <Skeleton className="h-16 rounded-xl" />;
  if (!data) return null;

  return (
    <div className="border-border bg-card grid grid-cols-3 gap-4 rounded-xl border p-4">
      <Stat
        value={String(data.completedJobs)}
        label={data.completedJobs === 1 ? "job completed" : "jobs completed"}
      />
      <Stat
        value={data.rating ? `${data.rating.toFixed(1)}★` : "—"}
        label={
          data.reviewCount === 0
            ? "no reviews yet"
            : `${data.reviewCount} review${data.reviewCount === 1 ? "" : "s"}`
        }
      />
      <Stat
        value={
          data.memberSince
            ? formatDistanceToNow(data.memberSince).replace("about ", "")
            : "—"
        }
        label="on Daisy.work"
      />
    </div>
  );
}

/** What other people actually said. Empty renders nothing, not an empty box. */
export function ReviewList({ userId }: { userId: string }) {
  const { data } = api.review.forUser.useQuery({ userId });
  if (!data?.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Reviews</h2>
      <ul className="divide-border border-border bg-card divide-y rounded-xl border">
        {data.map((r) => (
          <li key={r.id} className="space-y-1 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{r.authorName}</p>
              <p
                className="text-nav-active shrink-0"
                aria-label={`${r.rating} out of 5`}
              >
                {"★".repeat(r.rating)}
                <span className="text-muted-foreground">
                  {"☆".repeat(5 - r.rating)}
                </span>
              </p>
            </div>
            {r.comment ? (
              <p className="text-muted-foreground">{r.comment}</p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              {r.jobTitle} ·{" "}
              {formatDistanceToNow(r.createdAt, { addSuffix: true })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
