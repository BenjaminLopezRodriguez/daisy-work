import { WorkOrderScreen } from "@/ribs/work-order/work-order.rib";

export default async function WorkOrderPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  return <WorkOrderScreen workOrderId={workOrderId} />;
}
