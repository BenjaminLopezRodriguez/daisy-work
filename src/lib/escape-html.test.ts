import { describe, expect, it } from "vitest";

import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("neutralises markup a job title could smuggle into an email", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;",
    );
  });

  it("escapes ampersands before they can form entities", () => {
    expect(escapeHtml("Tile & grout <fix>")).toBe(
      "Tile &amp; grout &lt;fix&gt;",
    );
  });

  it("leaves ordinary text alone", () => {
    expect(escapeHtml("Fix the sink")).toBe("Fix the sink");
  });
});
