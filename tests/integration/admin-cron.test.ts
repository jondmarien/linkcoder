import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import {
  approveLink,
  disableLink,
  getReviewQueue,
  type ReviewQueueItem,
  rescanOldestCleanLinks,
} from "../../src/admin/review.ts";
import { createDb } from "../../src/db/client";
import { slugCacheKey } from "../../src/links/cache";

const now = Date.now();
const scannerEnv = {
  ...env,
  CLOUDFLARE_ACCOUNT_ID: "test-account",
  URL_SCANNER_API_TOKEN: "test-token",
};

const seedUser = async (id: string) => {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO users (id, email, email_verified, role, created_at, updated_at) VALUES (?, ?, 1, 'user', ?, ?)",
  )
    .bind(id, `${id}@example.com`, now, now)
    .run();
};

const seedLink = async (
  slug: string,
  status: "clean" | "suspicious" = "clean",
) => {
  const userId = `user-${slug}`;
  await seedUser(userId);
  await env.DB.prepare(
    "INSERT OR REPLACE INTO links (id, slug, url, user_id, created_at, scan_status, last_scanned_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      `link-${slug}`,
      slug,
      `https://example.com/${slug}`,
      userId,
      now,
      status,
      now - 60_000,
    )
    .run();
  await env.LINKS_KV.put(slugCacheKey(slug), JSON.stringify({ stale: true }));
};

describe("admin review and cron", () => {
  beforeEach(async () => {
    await seedLink("suspicious", "suspicious");
    await seedLink("reported", "clean");
    await seedLink("oldclean", "clean");
    await env.DB.prepare(
      "INSERT OR REPLACE INTO link_reports (id, link_id, reason, created_at) VALUES ('report-1', 'link-reported', 'bad link', ?)",
    )
      .bind(now)
      .run();
  });

  it("lists suspicious and reported links in the review queue", async () => {
    const queue = await getReviewQueue(createDb(env.DB));

    expect(queue.map((item: ReviewQueueItem) => item.slug)).toEqual(
      expect.arrayContaining(["suspicious", "reported"]),
    );
  });

  it("disables and approves links while invalidating KV cache", async () => {
    await disableLink(createDb(env.DB), env.LINKS_KV, "reported", "reviewed");
    await approveLink(createDb(env.DB), env.LINKS_KV, "suspicious");

    const disabled = await env.DB.prepare(
      "SELECT disabled_reason FROM links WHERE slug = 'reported'",
    ).first<{ disabled_reason: string }>();
    const approved = await env.DB.prepare(
      "SELECT scan_status FROM links WHERE slug = 'suspicious'",
    ).first<{ scan_status: string }>();

    expect(disabled?.disabled_reason).toBe("reviewed");
    expect(approved?.scan_status).toBe("clean");
    const unresolvedReports = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM link_reports WHERE link_id = 'link-reported' AND resolved_at IS NULL",
    ).first<{ count: number }>();

    expect(unresolvedReports?.count).toBe(0);
    await expect(
      env.LINKS_KV.get(slugCacheKey("reported")),
    ).resolves.toBeNull();
    await expect(
      env.LINKS_KV.get(slugCacheKey("suspicious")),
    ).resolves.toBeNull();
  });

  it("rescans old clean links and disables malicious destinations", async () => {
    await rescanOldestCleanLinks({
      db: createDb(env.DB),
      env: scannerEnv,
      fetcher: async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/urlscanner/v2/scan")) {
          return Response.json({ uuid: "scan-id" });
        }

        return Response.json({
          verdicts: { overall: { malicious: true, categories: ["malware"] } },
        });
      },
      limit: 10,
    });

    const rescanned = await env.DB.prepare(
      "SELECT scan_status, disabled_reason FROM links WHERE slug = 'oldclean'",
    ).first<{ scan_status: string; disabled_reason: string }>();

    expect(rescanned?.scan_status).toBe("malicious");
    expect(rescanned?.disabled_reason).toBe("malicious_rescan");
  });

  it("does not downgrade clean links when a rescan is inconclusive", async () => {
    await seedLink("pendingclean", "clean");

    await rescanOldestCleanLinks({
      db: createDb(env.DB),
      env: scannerEnv,
      fetcher: async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/urlscanner/v2/scan")) {
          return Response.json({ uuid: "scan-id" });
        }

        return new Response("not ready", { status: 404 });
      },
      limit: 10,
    });

    const rescanned = await env.DB.prepare(
      "SELECT scan_status, disabled_reason FROM links WHERE slug = 'pendingclean'",
    ).first<{ scan_status: string; disabled_reason: string | null }>();

    expect(rescanned?.scan_status).toBe("clean");
    expect(rescanned?.disabled_reason).toBeNull();
  });
});
