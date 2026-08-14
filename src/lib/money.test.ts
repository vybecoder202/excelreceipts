import { describe, expect, it } from "vitest";

import { formatMinorUnits, parseMinorUnits } from "./money";

describe("exact money conversion", () => {
  it("converts decimal strings without floating-point arithmetic", () => {
    expect(parseMinorUnits("1234567890.07")).toBe(123456789007n);
    expect(formatMinorUnits(123456789007n)).toBe("1234567890.07");
  });

  it("supports negative reversal values", () => {
    expect(parseMinorUnits("-19.50")).toBe(-1950n);
    expect(formatMinorUnits(-1950n)).toBe("-19.50");
  });

  it("rejects silent rounding", () => {
    expect(() => parseMinorUnits("10.009")).toThrow(/more than 2 decimal places/);
  });
});
