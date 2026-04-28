import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/index";

const now = Date.now();
const authSecret = "test-only-better-auth-secret-32-characters";

const signedCookieValue = async (value: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return `${value}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
};

const seedUser = async (id: string) => {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, email, email_verified, role, created_at, updated_at) VALUES (?, ?, 1, 'user', ?, ?)",
  )
    .bind(id, `${id}@example.com`, now, now)
    .run();
};

const seedAuthenticatedUser = async (
  id: string,
  options: { email?: string; name?: string } = {},
) => {
  const email = options.email ?? `${id}@example.com`;
  const token = `${id}-session-token`;
  await env.DB.prepare(
    "INSERT OR REPLACE INTO users (id, email, email_verified, name, role, created_at, updated_at) VALUES (?, ?, 1, ?, 'user', ?, ?)",
  )
    .bind(id, email, options.name ?? null, now, now)
    .run();
  await env.DB.prepare(
    "INSERT OR REPLACE INTO sessions (id, expires_at, token, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(`session-${id}`, now + 86_400_000, token, now, now, id)
    .run();
  const cookieValue = await signedCookieValue(token);

  return {
    headers: {
      cookie: `__Secure-better-auth.session_token=${encodeURIComponent(cookieValue)}`,
    },
    id,
  };
};

const seedLink = async (
  slug: string,
  url: string,
  options: {
    disabledAt?: number | null;
    expiresAt?: number | null;
    userId?: string;
  } = {},
) => {
  const userId = options.userId ?? `user-${slug}`;
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

  it("redirects unauthenticated browser create form posts to login", async () => {
    const response = await app.request(
      "/api/links",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ url: "https://example.com" }),
      },
      env,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
  });

  it("renders the create link page at /links/new", async () => {
    const response = await app.request("/links/new", undefined, env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("Create a short link");
    expect(html).not.toContain('"error":"Link not found."');
  });

  it("renders authenticated dashboard links with account identity", async () => {
    const user = await seedAuthenticatedUser("dashboard-user", {
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
    await seedLink("bhacks26", "https://bearhacks.com/", { userId: user.id });
    await env.DB.prepare("UPDATE links SET click_count = 4 WHERE slug = ?")
      .bind("bhacks26")
      .run();

    const response = await app.request(
      "/dashboard",
      { headers: user.headers },
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("https://link.chron0.tech/bhacks26");
    expect(html).toContain("https://bearhacks.com/");
    expect(html).toContain(">4<");
    expect(html).not.toContain("No links yet");
  });

  it("shows the public short URL with a copy control after browser creation", async () => {
    const user = await seedAuthenticatedUser("creator-user");

    const createResponse = await app.request(
      "/api/links",
      {
        method: "POST",
        headers: {
          ...user.headers,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          url: "https://bearhacks.com/",
          slug: "bhacks-copy",
        }),
      },
      env,
    );

    expect(createResponse.status).toBe(302);
    expect(createResponse.headers.get("location")).toBe("/links/bhacks-copy");

    const detailResponse = await app.request(
      "/links/bhacks-copy",
      { headers: user.headers },
      env,
    );
    const html = await detailResponse.text();

    expect(detailResponse.status).toBe(200);
    expect(html).toContain("https://link.chron0.tech/bhacks-copy");
    expect(html).toContain("Copy short link");
    expect(html).toContain('data-copy="https://link.chron0.tech/bhacks-copy"');
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

  it("persists redirect click counts for dashboard stats", async () => {
    await seedLink("clicks1", "https://example.com/clicked");

    const response = await app.request("/clicks1", undefined, env);
    const row = await env.DB.prepare(
      "SELECT click_count FROM links WHERE slug = ?",
    )
      .bind("clicks1")
      .first<{ click_count: number }>();

    expect(response.status).toBe(302);
    expect(row?.click_count).toBe(1);
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
