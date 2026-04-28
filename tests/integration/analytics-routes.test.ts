import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("analytics routes", () => {
  it("requires authentication for the analytics API", async () => {
    const response = await app.request("/api/analytics/demo", undefined, env);

    expect(response.status).toBe(401);
  });

  it("requires authentication for link detail pages", async () => {
    const response = await app.request("/links/demo", undefined, env);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
  });
});
