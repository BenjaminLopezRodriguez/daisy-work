import { SubmissionReviewScreen } from "@/ribs/submission-review/submission-review.rib";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  return <SubmissionReviewScreen workOrderId={workOrderId} />;
}
