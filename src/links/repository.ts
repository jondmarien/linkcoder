import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { links, users } from "../db/schema";
import { randomSlug } from "./slug";

export type LinkRecord = typeof links.$inferSelect;

export type CreateLinkInput = {
  slug: string;
  url: string;
  userId: string;
  expiresAt?: Date | null;
  scanStatus: "pending" | "clean" | "suspicious" | "malicious";
  scanVerdictJson?: string | null;
};

export type UpdateLinkScanInput = {
  scanStatus: "pending" | "clean" | "suspicious" | "malicious";
  scanVerdictJson: string;
};

export const getLinkBySlug = async (db: Db, slug: string) => {
  const [link] = await db.select().from(links).where(eq(links.slug, slug));
  return link ?? null;
};

export const getLinkWithOwnerBySlug = async (db: Db, slug: string) => {
  const [row] = await db
    .select({
      link: links,
      ownerVerified: users.emailVerified,
    })
    .from(links)
    .innerJoin(users, eq(links.userId, users.id))
    .where(eq(links.slug, slug));

  if (!row) {
    return null;
  }

  return {
    ...row.link,
    ownerVerified: row.ownerVerified,
  };
};

export const listLinksByUser = async (db: Db, userId: string) =>
  db
    .select()
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt));

export const slugExists = async (db: Db, slug: string) =>
  (await getLinkBySlug(db, slug)) !== null;

export const generateUniqueSlug = async (db: Db) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = randomSlug();

    if (!(await slugExists(db, slug))) {
      return slug;
    }
  }

  throw new Error("Unable to generate a unique slug.");
};

export const createLink = async (db: Db, input: CreateLinkInput) => {
  const now = new Date();
  const [link] = await db
    .insert(links)
    .values({
      id: crypto.randomUUID(),
      slug: input.slug,
      url: input.url,
      userId: input.userId,
      createdAt: now,
      expiresAt: input.expiresAt ?? null,
      scanStatus: input.scanStatus,
      scanVerdictJson: input.scanVerdictJson ?? null,
      lastScannedAt: now,
    })
    .returning();

  if (!link) {
    throw new Error("Failed to create link.");
  }

  return link;
};

export const updateLinkScan = async (
  db: Db,
  slug: string,
  input: UpdateLinkScanInput,
) => {
  await db
    .update(links)
    .set({
      lastScannedAt: new Date(),
      scanStatus: input.scanStatus,
      scanVerdictJson: input.scanVerdictJson,
    })
    .where(eq(links.slug, slug));
};

export const incrementLinkClicks = async (db: Db, slug: string) => {
  await db
    .update(links)
    .set({ clickCount: sql`${links.clickCount} + 1` })
    .where(eq(links.slug, slug));
};
