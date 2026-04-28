import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/index";
import { slugCacheKey } from "../../src/links/cache";

const now = Date.now();

const seedUser = async (id: string, verified: boolean) => {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO users (id, email, email_verified, role, created_at, updated_at) VALUES (?, ?, ?, 'user', ?, ?)",
  )
    .bind(id, `${id}@example.com`, verified ? 1 : 0, now, now)
    .run();
};

const seedLink = async (slug: string, userId: string) => {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO links (id, slug, url, user_id, created_at, scan_status) VALUES (?, ?, ?, ?, ?, 'clean')",
  )
    .bind(`link-${slug}`, slug, `https://example.com/${slug}`, userId, now)
    .run();
  await env.LINKS_KV.delete(slugCacheKey(slug));
};

describe("abuse controls", () => {
  beforeEach(async () => {
    await env.LINKS_KV.delete(slugCacheKey("verifyme"));
    await env.LINKS_KV.delete(slugCacheKey("reportme"));
  });

  it("blocks redirects for links owned by unverified users", async () => {
    await seedUser("unverified-user", false);
    await seedLink("verifyme", "unverified-user");

    const response = await app.request("/verifyme", undefined, env);

    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toContain("awaiting verification");
    await expect(env.LINKS_KV.get(slugCacheKey("verifyme"))).resolves.toContain(
      '"owner_verified":false',
    );
  });

  it("creates a public abuse report for a link", async () => {
    await seedUser("verified-user", true);
    await seedLink("reportme", "verified-user");

    const response = await app.request(
      "/report",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "reportme",
          reason: "Looks suspicious",
          reporter_email: "reporter@example.com",
        }),
      },
      env,
    );

    const report = await env.DB.prepare(
      "SELECT reason, reporter_email FROM link_reports WHERE link_id = ?",
    )
      .bind("link-reportme")
      .first<{ reason: string; reporter_email: string }>();

    expect(response.status).toBe(201);
    expect(report).toEqual({
      reason: "Looks suspicious",
      reporter_email: "reporter@example.com",
    });
  });
});
