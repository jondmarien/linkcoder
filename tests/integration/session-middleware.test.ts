import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("session middleware", () => {
  it("redirects anonymous dashboard requests to login", async () => {
    const response = await app.request("/dashboard", undefined, env);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
  });
});
