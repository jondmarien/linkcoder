import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  accounts,
  authSchema,
  linkReports,
  links,
  sessions,
  users,
  verifications,
} from "../../src/db/schema";

describe("database schema", () => {
  it("uses the plan's plural table names", () => {
    expect(getTableName(users)).toBe("users");
    expect(getTableName(sessions)).toBe("sessions");
    expect(getTableName(accounts)).toBe("accounts");
    expect(getTableName(verifications)).toBe("verifications");
    expect(getTableName(links)).toBe("links");
    expect(getTableName(linkReports)).toBe("link_reports");
  });

  it("maps plural Drizzle tables to Better Auth model names", () => {
    expect(authSchema.user).toBe(users);
    expect(authSchema.session).toBe(sessions);
    expect(authSchema.account).toBe(accounts);
    expect(authSchema.verification).toBe(verifications);
  });
});
