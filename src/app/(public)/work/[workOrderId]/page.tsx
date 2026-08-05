import type { Metadata } from "next";

import { formatMoney } from "@/domain";
import { NOT_FOUND_METADATA, detailMetadata } from "@/lib/share-meta";
import { WorkOrderScreen } from "@/ribs/work-order/work-order.rib";
import { auth } from "@/server/auth";
import { createDbWorkOrderService } from "@/server/services/db/work-order";

import { WorkBreadcrumbs } from "./work-breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}): Promise<Metadata> {
  const { workOrderId } = await params;
  const wo = await createDbWorkOrderService().getById(workOrderId);
  if (!wo) return NOT_FOUND_METADATA;

  return detailMetadata({
    title: `${wo.title} · ${formatMoney(wo.budgetAmount, wo.currency)}`,
    description: wo.description,
    path: `/work/${wo.id}`,
  });
}

export default async function WorkOrderPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  const session = await auth();
  return (
    <>
      <WorkBreadcrumbs
        workOrderId={workOrderId}
        signedIn={Boolean(session?.user)}
      />
      <WorkOrderScreen workOrderId={workOrderId} />
    </>
  );
}
