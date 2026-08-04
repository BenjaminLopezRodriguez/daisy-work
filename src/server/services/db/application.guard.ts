/** Pure apply guard — no db, no env. Kept separate so it is unit-testable. */
export type ApplyDenial = "NOT_FOUND" | "NOT_PUBLISHED" | "OWN_JOB";

export function applyDenialReason(
  job: { requesterId: string; status: string } | null | undefined,
  applicantId: string,
): ApplyDenial | null {
  if (!job) return "NOT_FOUND";
  if (job.status !== "published") return "NOT_PUBLISHED";
  if (job.requesterId === applicantId) return "OWN_JOB";
  return null;
}
