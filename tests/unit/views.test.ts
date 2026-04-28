import { describe, expect, it } from "vitest";
import { dashboardPage } from "../../src/views/dashboard";

describe("dashboard view", () => {
  it("renders a link management skeleton", () => {
    const html = dashboardPage({
      appOrigin: "https://link.chron0.tech",
      links: [
        {
          clickCount: 0,
          disabledAt: null,
          expiresAt: null,
          scanStatus: "clean",
          slug: "atlas7",
          url: "https://example.com/",
        },
      ],
      theme: "light",
    }).toString();

    expect(html).toContain("Your links");
    expect(html).toContain("Create a short link");
    expect(html).toContain("Clicks");
    expect(html).toContain("Expires");
    expect(html).toContain("No expiration");
  });
});
