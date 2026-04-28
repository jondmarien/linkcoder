import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("auth routes", () => {
  it("mounts the Better Auth handler under /api/auth/*", async () => {
    const response = await app.request(
      "/api/auth/get-session",
      {
        headers: { accept: "application/json" },
      },
      env,
    );

    expect(response.status).not.toBe(404);
    expect(response.status).toBeLessThan(500);
  });

  it.each([
    "/login",
    "/signup",
    "/verify",
  ])("renders the %s auth page", async (path) => {
    const response = await app.request(path, undefined, env);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("chron0");
  });
});
