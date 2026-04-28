import { describe, expect, it } from "vitest";
import { dashboardPage } from "../../src/views/dashboard";

describe("dashboard view", () => {
  it("renders a link management skeleton", () => {
    const html = dashboardPage({ theme: "light" }).toString();

    expect(html).toContain("Your links");
    expect(html).toContain("Create a short link");
    expect(html).toContain("Clicks");
  });
});
