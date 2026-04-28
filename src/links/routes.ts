import { Hono } from "hono";
import { createDb } from "../db/client";
import type { HonoAppEnv } from "../types";
import { toCachedLink, writeSlugCache } from "./cache";
import { createLink, generateUniqueSlug, slugExists } from "./repository";
import { isValidCustomSlug, normalizeDestinationUrl } from "./slug";

type CreateLinkBody = {
  url?: string;
  slug?: string;
  expires_at?: string;
};

export const linkRoutes = new Hono<HonoAppEnv>();

const parseCreateBody = async (request: Request): Promise<CreateLinkBody> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as CreateLinkBody;
  }

  const form = await request.formData();
  return {
    url: String(form.get("url") ?? ""),
    slug: String(form.get("slug") ?? ""),
    expires_at: String(form.get("expires_at") ?? ""),
  };
};

linkRoutes.post("/api/links", async (c) => {
  const session = c.get("session");

  if (!session) {
    return c.json({ error: "Authentication required." }, 401);
  }

  const body = await parseCreateBody(c.req.raw);

  if (!body.url) {
    return c.json({ error: "A destination URL is required." }, 400);
  }

  let url: string;
  try {
    url = normalizeDestinationUrl(body.url);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid URL." },
      400,
    );
  }

  const db = createDb(c.env.DB);
  const requestedSlug = body.slug?.trim();

  if (requestedSlug && !isValidCustomSlug(requestedSlug)) {
    return c.json({ error: "Custom slug is not available." }, 400);
  }

  const slug = requestedSlug || (await generateUniqueSlug(db));

  if (await slugExists(db, slug)) {
    return c.json({ error: "Slug already exists." }, 409);
  }

  const expiresAt = body.expires_at ? new Date(body.expires_at) : null;

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return c.json({ error: "Expiration date is invalid." }, 400);
  }

  const link = await createLink(db, {
    slug,
    url,
    userId: session.user.id,
    expiresAt,
  });
  await writeSlugCache(
    c.env.LINKS_KV,
    slug,
    toCachedLink(link, Boolean(session.user.emailVerified)),
  );

  return c.json(
    {
      id: link.id,
      slug: link.slug,
      url: link.url,
      short_url: `${c.env.APP_ORIGIN}/${link.slug}`,
      expires_at: link.expiresAt?.toISOString() ?? null,
    },
    201,
  );
});
