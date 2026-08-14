import { describe, expect, it } from "vitest";

import {
  isOwnerEmailAllowlisted,
  normalizeEmail,
  parseOwnerEmailAllowlist,
} from "./owner-allowlist";

describe("owner email allowlist", () => {
  it("normalizes email addresses without exposing configured values", () => {
    expect(normalizeEmail("  Owner@Example.Test ")).toBe("owner@example.test");
  });

  it("parses comma, semicolon, and newline separated entries", () => {
    expect(
      parseOwnerEmailAllowlist(
        "owner@example.test; viewer@example.test\nowner@example.test",
      ),
    ).toEqual(["owner@example.test", "viewer@example.test"]);
  });

  it("matches case-insensitively and rejects missing identities", () => {
    expect(isOwnerEmailAllowlisted("OWNER@example.test", "owner@example.test")).toBe(true);
    expect(isOwnerEmailAllowlisted("other@example.test", "owner@example.test")).toBe(false);
    expect(isOwnerEmailAllowlisted(null, "owner@example.test")).toBe(false);
  });
});
