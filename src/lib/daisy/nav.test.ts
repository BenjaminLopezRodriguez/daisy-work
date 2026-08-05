import { describe, expect, it } from "vitest";

import { isNavActive, navForRole, parentForPath, titleForPath } from "./nav";

const shape = (choice: Parameters<typeof navForRole>[0]) =>
  navForRole(choice).map((i) => [i.label, i.href, i.emphasize ?? false]);

describe("navForRole", () => {
  it("names the provider's slots for the side of the market they are on", () => {
    expect(shape("provide")).toEqual([
      ["Home", "/home", false],
      ["Find work", "/marketplace?scope=jobs", false],
      ["Offer", "/services", true],
      ["My work", "/work", false],
      ["Account", "/account", false],
    ]);
  });

  it("leaves hire mode alone", () => {
    expect(shape("hire")).toEqual([
      ["Home", "/home", false],
      ["Browse", "/marketplace", false],
      ["Post a job", "/create", true],
      ["Requests", "/work", false],
      ["Account", "/account", false],
    ]);
  });

  it("falls back to the hire shape before a mode is chosen, unemphasised", () => {
    expect(shape(null)).toEqual([
      ["Home", "/home", false],
      ["Browse", "/marketplace", false],
      ["Post a job", "/create", false],
      ["Requests", "/work", false],
      ["Account", "/account", false],
    ]);
  });

  it("always renders five slots", () => {
    for (const choice of ["hire", "provide", null] as const) {
      expect(navForRole(choice)).toHaveLength(5);
    }
  });
});

describe("isNavActive", () => {
  it("matches a nav href that carries a default query", () => {
    // The provider's Browse tab. Without stripping the query this is false and
    // the tab renders inactive on the page it just navigated to.
    expect(isNavActive("/marketplace", "/marketplace?scope=jobs")).toBe(true);
  });

  it("still matches plain hrefs and child routes", () => {
    expect(isNavActive("/marketplace", "/marketplace")).toBe(true);
    expect(isNavActive("/services/abc", "/marketplace")).toBe(true); // §3.3
    expect(isNavActive("/work/abc", "/work")).toBe(true);
  });

  it("does not match unrelated routes", () => {
    expect(isNavActive("/account", "/work")).toBe(false);
    expect(isNavActive("/marketplace", "/create")).toBe(false);
  });
});

describe("titleForPath", () => {
  it("renames the work slot for providers only", () => {
    expect(titleForPath("/work", "provide")).toBe("My work");
    expect(titleForPath("/work", "hire")).toBe("Requests");
    expect(titleForPath("/work")).toBe("Requests");
  });

  it("leaves detail titles alone in both modes", () => {
    expect(titleForPath("/work/abc", "provide")).toBe("Request");
    expect(titleForPath("/work/abc", "hire")).toBe("Request");
  });

  it("falls back to the brand for unknown paths", () => {
    expect(titleForPath("/nope", "provide")).toBe("Daisy.work");
  });
});

describe("parentForPath", () => {
  it("sends detail routes back to their owning slot", () => {
    expect(parentForPath("/services/abc")?.href).toBe("/marketplace");
    expect(parentForPath("/work/abc")?.href).toBe("/work");
  });

  it("gives top-level routes no back affordance", () => {
    expect(parentForPath("/work")).toBeNull();
    expect(parentForPath("/home")).toBeNull();
  });
});
