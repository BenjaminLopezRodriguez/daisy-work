import ServicePublicView from "./service-public";

export default async function Page({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  return <ServicePublicView serviceId={serviceId} />;
}
