"use client";

import { Breadcrumbs } from "@/components/daisy/breadcrumbs";
import { api } from "@/trpc/react";

/**
 * §3.3: `Requests › {title}`. A signed-out visitor has no Requests list to
 * return to, so their trail roots at `Browse` (/marketplace) — the only place
 * they could have come from.
 *
 * Shares the `work.byId` query key with WorkOrderScreen, so this costs no
 * extra request.
 */
export function WorkBreadcrumbs({
  workOrderId,
  signedIn,
}: {
  workOrderId: string;
  signedIn: boolean;
}) {
  const { data, isError } = api.work.byId.useQuery({ id: workOrderId });
  if (isError) return null;

  const root = signedIn
    ? { label: "Requests", href: "/work" }
    : { label: "Browse", href: "/marketplace" };

  return (
    <div className="mx-auto mb-4 w-full max-w-2xl">
      <Breadcrumbs trail={[root]} page={data?.title ?? null} />
    </div>
  );
}
