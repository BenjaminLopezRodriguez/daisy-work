import { WorkOrderEditScreen } from "@/ribs/work-order/work-order-edit.rib";

export default async function WorkOrderEditPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  return <WorkOrderEditScreen workOrderId={workOrderId} />;
}
