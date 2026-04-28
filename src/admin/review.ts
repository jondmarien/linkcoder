import { and, asc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { linkReports, links } from "../db/schema";
import type { AppEnv } from "../env";
import { slugCacheKey } from "../links/cache";
import { scanDestinationUrl } from "../links/scan";

export type ReviewQueueItem = {
  slug: string;
  url: string;
  scanStatus: string;
  reportCount: number;
};

export const getReviewQueue = async (db: Db): Promise<ReviewQueueItem[]> => {
  const rows = await db
    .select({
      slug: links.slug,
      url: links.url,
      scanStatus: links.scanStatus,
      reportCount: sql<number>`count(${linkReports.id})`,
    })
    .from(links)
    .leftJoin(
      linkReports,
      and(eq(linkReports.linkId, links.id), isNull(linkReports.resolvedAt)),
    )
    .where(or(eq(links.scanStatus, "suspicious"), isNotNull(linkReports.id)))
    .groupBy(links.id)
    .orderBy(asc(links.createdAt));

  return rows;
};

const resolveReportsForSlug = async (db: Db, slug: string) => {
  const link = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.slug, slug))
    .get();

  if (!link) {
    return;
  }

  await db
    .update(linkReports)
    .set({ resolvedAt: new Date() })
    .where(
      and(eq(linkReports.linkId, link.id), isNull(linkReports.resolvedAt)),
    );
};

export const disableLink = async (
  db: Db,
  kv: KVNamespace,
  slug: string,
  reason: string,
) => {
  await db
    .update(links)
    .set({
      disabledAt: new Date(),
      disabledReason: reason,
    })
    .where(eq(links.slug, slug));
  await resolveReportsForSlug(db, slug);
  await kv.delete(slugCacheKey(slug));
};

export const approveLink = async (db: Db, kv: KVNamespace, slug: string) => {
  await db
    .update(links)
    .set({
      disabledAt: null,
      disabledReason: null,
      scanStatus: "clean",
    })
    .where(eq(links.slug, slug));
  await resolveReportsForSlug(db, slug);
  await kv.delete(slugCacheKey(slug));
};

export const rescanOldestCleanLinks = async ({
  db,
  env,
  fetcher = fetch,
  limit = 25,
}: {
  db: Db;
  env: Pick<AppEnv, "CLOUDFLARE_ACCOUNT_ID" | "URL_SCANNER_API_TOKEN"> & {
    LINKS_KV?: KVNamespace;
  };
  fetcher?: typeof fetch;
  limit?: number;
}) => {
  const candidates = await db
    .select()
    .from(links)
    .where(eq(links.scanStatus, "clean"))
    .orderBy(asc(links.lastScannedAt), asc(links.createdAt))
    .limit(limit);

  for (const link of candidates) {
    const scan = await scanDestinationUrl({ env, fetcher, url: link.url });
    const now = new Date();

    if (scan.status === "malicious") {
      await db
        .update(links)
        .set({
          scanStatus: "malicious",
          scanVerdictJson: JSON.stringify(scan.verdict),
          lastScannedAt: now,
          disabledAt: now,
          disabledReason: "malicious_rescan",
        })
        .where(eq(links.id, link.id));

      if (env.LINKS_KV) {
        await env.LINKS_KV.delete(slugCacheKey(link.slug));
      }

      continue;
    }

    await db
      .update(links)
      .set({
        scanStatus: scan.status === "clean" ? "clean" : link.scanStatus,
        scanVerdictJson: JSON.stringify(scan.verdict),
        lastScannedAt: now,
      })
      .where(eq(links.id, link.id));

    if (env.LINKS_KV && scan.status === "clean") {
      await env.LINKS_KV.delete(slugCacheKey(link.slug));
    }
  }
};
