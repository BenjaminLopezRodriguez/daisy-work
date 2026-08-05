import { formatMoney } from "@/domain";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";
import { createDbWorkOrderService } from "@/server/services/db/work-order";

export const alt = "Job on Daisy.work";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  const wo = await createDbWorkOrderService().getById(workOrderId);

  return ogCard({
    eyebrow: "Job",
    title: wo?.title ?? "Job not found",
    meta: wo
      ? `${formatMoney(wo.budgetAmount, wo.currency)} · ${wo.category}`
      : undefined,
  });
}
