import { describe, expect, it } from "vitest";

import { truncate } from "./share-meta";

describe("truncate", () => {
  it("leaves short strings alone", () => {
    expect(truncate("Fix the sink", 20)).toBe("Fix the sink");
  });

  it("cuts at a word boundary when there is a late enough space", () => {
    expect(truncate("licensed electrician for a panel upgrade", 20)).toBe(
      "licensed electrician…",
    );
  });

  it("hard-cuts a long unbroken token rather than returning nothing", () => {
    expect(truncate("a".repeat(50), 10)).toBe(`${"a".repeat(10)}…`);
  });
});
