import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("admin routes", () => {
  it("redirects anonymous review queue requests to login", async () => {
    const response = await app.request("/admin/review", undefined, env);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
  });
});
