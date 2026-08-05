import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { WorkOrderEditScreen } from "@/ribs/work-order/work-order-edit.rib";

export default async function WorkOrderEditPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  // This sits under (public) now, so it no longer inherits the session gate.
  // Editing still requires a session; ownership is enforced in work.update.
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return <WorkOrderEditScreen workOrderId={workOrderId} />;
}
