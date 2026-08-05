import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/daisy/breadcrumbs";
import { formatMoney } from "@/domain";
import { NOT_FOUND_METADATA, detailMetadata } from "@/lib/share-meta";
import { getServiceById } from "@/server/services/db/service-listing";

import ServicePublicView from "./service-public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}): Promise<Metadata> {
  const { serviceId } = await params;
  const service = await getServiceById(serviceId);
  if (!service) return NOT_FOUND_METADATA;

  return detailMetadata({
    title: `${service.title} · ${formatMoney(service.priceCents, "USD")}`,
    description:
      service.description ||
      `A service offered on Daisy.work${service.ownerName ? ` by ${service.ownerName}` : ""}.`,
    path: `/services/${service.id}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const service = await getServiceById(serviceId);
  return (
    <>
      <Breadcrumbs
        trail={[
          { href: "/marketplace", label: "Browse" },
          { href: "/marketplace?scope=services", label: "Services" },
        ]}
        page={service?.title ?? null}
        className="mb-2"
      />
      <ServicePublicView serviceId={serviceId} />
    </>
  );
}
