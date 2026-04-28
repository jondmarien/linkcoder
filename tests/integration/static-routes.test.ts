import { describe, expect, it } from "vitest";
import app from "../../src/index";

describe("static routes", () => {
  it.each([
    ["/terms", "Terms of Service"],
    ["/privacy", "Privacy Policy"],
    ["/help", "Help"],
  ])("renders %s", async (path, heading) => {
    const response = await app.request(path);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain(heading);
  });

  it("serves robots.txt", async () => {
    const response = await app.request("/robots.txt");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Sitemap: https://link.chron0.tech/sitemap.xml");
  });

  it("serves sitemap.xml", async () => {
    const response = await app.request("/sitemap.xml");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(body).toContain("<loc>https://link.chron0.tech/</loc>");
    expect(body).toContain("<loc>https://link.chron0.tech/help</loc>");
  });
});
