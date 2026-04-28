import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/index";

const now = Date.now();

const seedUser = async (id: string) => {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, email, email_verified, role, created_at, updated_at) VALUES (?, ?, 1, 'user', ?, ?)",
  )
    .bind(id, `${id}@example.com`, now, now)
    .run();
};

const seedLink = async (
  slug: string,
  url: string,
  options: { disabledAt?: number | null; expiresAt?: number | null } = {},
) => {
  const userId = `user-${slug}`;
  await seedUser(userId);
  await env.DB.prepare(
    "INSERT OR REPLACE INTO links (id, slug, url, user_id, created_at, expires_at, disabled_at, disabled_reason, scan_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'clean')",
  )
    .bind(
      `link-${slug}`,
      slug,
      url,
      userId,
      now,
      options.expiresAt ?? null,
      options.disabledAt ?? null,
      options.disabledAt ? "test disabled" : null,
    )
    .run();
  await env.LINKS_KV.delete(`slug:${slug}`);
};

describe("link routes", () => {
  beforeEach(async () => {
    await env.LINKS_KV.delete("slug:go1234");
    await env.LINKS_KV.delete("slug:expired1");
  });

  it("requires authentication to create a link", async () => {
    const response = await app.request(
      "/api/links",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      },
      env,
    );

    expect(response.status).toBe(401);
  });

  it("renders the create link page at /links/new", async () => {
    const response = await app.request("/links/new", undefined, env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("Create a short link");
    expect(html).not.toContain('"error":"Link not found."');
  });

  it("redirects from D1 and writes the KV cache on miss", async () => {
    await seedLink("go1234", "https://example.com/page");

    const response = await app.request("/go1234", undefined, env);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/page");
    await expect(env.LINKS_KV.get("slug:go1234")).resolves.toContain(
      "https://example.com/page",
    );
  });

  it("renders friendly not-found and expired pages", async () => {
    await seedLink("expired1", "https://example.com/old", {
      expiresAt: now - 1000,
    });

    const missing = await app.request("/missing-link", undefined, env);
    const expired = await app.request("/expired1", undefined, env);

    expect(missing.status).toBe(404);
    await expect(missing.text()).resolves.toContain("Link not found");
    expect(expired.status).toBe(410);
    await expect(expired.text()).resolves.toContain("Link expired");
  });
});
