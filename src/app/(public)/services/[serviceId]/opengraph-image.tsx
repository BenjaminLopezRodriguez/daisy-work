import { formatMoney } from "@/domain";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";
import { getServiceById } from "@/server/services/db/service-listing";

export const alt = "Service on Daisy.work";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const service = await getServiceById(serviceId);

  return ogCard({
    eyebrow: "Service",
    title: service?.title ?? "Service not found",
    meta: service
      ? `${formatMoney(service.priceCents, "USD")}${service.ownerName ? ` · ${service.ownerName}` : ""}`
      : undefined,
  });
}
