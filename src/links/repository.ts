import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { links } from "../db/schema";
import { randomSlug } from "./slug";

export type LinkRecord = typeof links.$inferSelect;

export type CreateLinkInput = {
  slug: string;
  url: string;
  userId: string;
  expiresAt?: Date | null;
};

export const getLinkBySlug = async (db: Db, slug: string) => {
  const [link] = await db.select().from(links).where(eq(links.slug, slug));
  return link ?? null;
};

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
      scanStatus: "clean",
    })
    .returning();

  if (!link) {
    throw new Error("Failed to create link.");
  }

  return link;
};
