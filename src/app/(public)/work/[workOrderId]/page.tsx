import { WorkOrderScreen } from "@/ribs/work-order/work-order.rib";
import { auth } from "@/server/auth";

import { WorkBreadcrumbs } from "./work-breadcrumbs";

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
