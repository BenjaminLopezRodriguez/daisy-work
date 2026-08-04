import { describe, expect, it } from "vitest";

import { applyDenialReason } from "./application.guard";

describe("applyDenialReason", () => {
  const job = { requesterId: "owner", status: "published" };

  it("allows a signed-in non-owner to apply to a published job", () => {
    expect(applyDenialReason(job, "worker")).toBeNull();
  });

  it("rejects missing, unpublished, and own jobs", () => {
    expect(applyDenialReason(null, "worker")).toBe("NOT_FOUND");
    expect(applyDenialReason({ ...job, status: "draft" }, "worker")).toBe(
      "NOT_PUBLISHED",
    );
    expect(applyDenialReason(job, "owner")).toBe("OWN_JOB");
  });
});
