import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("health endpoint", () => {
  it("serves a hello-world root response", async () => {
    const response = await app.request("/");

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe(
      "Hello from chron0 link shortener.",
    );
  });

  it("returns ok JSON for /healthz", async () => {
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
