import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("health endpoint", () => {
  it("serves the styled landing page", async () => {
    const response = await app.request("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toContain("no-transform");
    expect(html).toContain('href="/assets/styles.css"');
    expect(html).toContain('rel="icon"');
    expect(html).toContain('href="/favicon.svg"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('content="Short links with a longer memory."');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('content="https://link.chron0.tech/og-image.png"');
    expect(html).toContain('property="og:image:type" content="image/png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('href="https://link.chron0.tech/"');
    expect(html).toContain("Short links with a longer memory");
    expect(html).toContain("data-theme-toggle");
  });

  it("renders the dark theme from the theme cookie", async () => {
    const response = await app.request("/", {
      headers: { cookie: "theme=dark" },
    });

    expect(await response.text()).toContain('<html lang="en" class="dark">');
  });

  it("returns ok JSON for /healthz", async () => {
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
