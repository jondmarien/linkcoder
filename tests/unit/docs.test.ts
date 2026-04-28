import { describe, expect, it } from "vitest";
import development from "../../DEVELOPMENT.md?raw";

describe("documentation", () => {
  it("includes launch smoke-test coverage", () => {
    expect(development).toContain("Smoke Test Checklist");
    expect(development).toContain("Create a short link");
    expect(development).toContain("Verify redirect");
  });
});
