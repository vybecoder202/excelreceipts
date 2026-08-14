import { describe, expect, it } from "vitest";

import { safeNextPath } from "./navigation";

describe("safeNextPath", () => {
  it("accepts local absolute paths", () => {
    expect(safeNextPath("/setup?step=project")).toBe("/setup?step=project");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeNextPath("https://example.test")).toBe("/");
    expect(safeNextPath("//example.test")).toBe("/");
    expect(safeNextPath("/\\example.test")).toBe("/");
  });

  it("uses an explicit fallback for missing values", () => {
    expect(safeNextPath(undefined, "/sign-in")).toBe("/sign-in");
  });
});
