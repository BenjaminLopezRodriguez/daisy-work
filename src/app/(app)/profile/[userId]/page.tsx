import { WorkerProfileScreen } from "@/ribs/worker-profile/worker-profile.rib";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <WorkerProfileScreen userId={userId} />;
}
