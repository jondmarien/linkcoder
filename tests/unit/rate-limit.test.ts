import { describe, expect, it } from "vitest";
import { checkRateLimit } from "../../src/rate-limit";

describe("rate limit helpers", () => {
  it("returns a 429 response when a binding denies the key", async () => {
    const response = await checkRateLimit(
      { limit: async () => ({ success: false }) },
      "actor",
    );

    expect(response?.status).toBe(429);
    await expect(response?.json()).resolves.toEqual({
      error: "Rate limit exceeded.",
    });
  });

  it("continues when the binding allows the key", async () => {
    const response = await checkRateLimit(
      { limit: async () => ({ success: true }) },
      "actor",
    );

    expect(response).toBeNull();
  });
});
