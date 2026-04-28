import { describe, expect, it } from "vitest";
import {
  isAdminEmail,
  parseAdminEmails,
  shouldPromoteAdmin,
} from "../../src/admin/auth";

describe("admin auth helpers", () => {
  it("parses admin emails from a comma-separated environment value", () => {
    expect(
      parseAdminEmails(" Admin@Example.com, second@example.com ,, "),
    ).toEqual(["admin@example.com", "second@example.com"]);
  });

  it("checks admin emails case-insensitively", () => {
    expect(isAdminEmail("ADMIN@example.com", "admin@example.com")).toBe(true);
    expect(isAdminEmail("user@example.com", "admin@example.com")).toBe(false);
  });

  it("does not promote users already marked as admin", () => {
    expect(
      shouldPromoteAdmin(
        { email: "admin@example.com", role: "admin" },
        "admin@example.com",
      ),
    ).toBe(false);
  });
});
