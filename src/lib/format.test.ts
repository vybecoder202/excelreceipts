import { describe, expect, it } from "vitest";

import { dateInputValue, humanizeStatus } from "./format";

describe("display formatting", () => {
  it("creates an ISO input date in the project timezone", () => {
    expect(dateInputValue("Africa/Lusaka", new Date("2026-08-13T22:30:00Z"))).toBe("2026-08-14");
  });

  it("turns database statuses into readable labels", () => {
    expect(humanizeStatus("in_progress")).toBe("in progress");
  });
});
