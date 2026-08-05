import ProviderPublicPage from "./provider-public";

export default async function Page({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  return <ProviderPublicPage profileId={profileId} />;
}
