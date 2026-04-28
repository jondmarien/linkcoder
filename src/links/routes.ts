import { Hono } from "hono";
import { createDb } from "../db/client";
import { checkRateLimit, getClientIp } from "../rate-limit";
import { readTheme } from "../theme";
import type { HonoAppEnv } from "../types";
import { newLinkPage } from "../views/new-link";
import { toCachedLink, writeSlugCache } from "./cache";
import { createLink, generateUniqueSlug, slugExists } from "./repository";
import { scanDestinationUrl } from "./scan";
import { isValidCustomSlug, normalizeDestinationUrl } from "./slug";

type CreateLinkBody = {
  url?: string;
  slug?: string;
  expires_at?: string;
};

export const linkRoutes = new Hono<HonoAppEnv>();

linkRoutes.get("/links/new", (c) =>
  c.html(newLinkPage({ theme: readTheme(c), user: c.get("session")?.user })),
);

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

const isBrowserFormPost = (request: Request) =>
  (request.headers.get("content-type") ?? "").includes(
    "application/x-www-form-urlencoded",
  );

linkRoutes.post("/api/links", async (c) => {
  const session = c.get("session");
  const browserFormPost = isBrowserFormPost(c.req.raw);

  if (!session) {
    if (browserFormPost) {
      return c.redirect("/login");
    }

    return c.json({ error: "Authentication required." }, 401);
  }

  const ipLimit = await checkRateLimit(
    c.env.CREATE_LINKS_BY_IP,
    `create:${getClientIp(c.req.raw.headers)}`,
  );

  if (ipLimit) {
    return ipLimit;
  }

  const userLimit = await checkRateLimit(
    c.env.CREATE_LINKS_BY_USER,
    `create:${session.user.id}`,
  );

  if (userLimit) {
    return userLimit;
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

  const scan = await scanDestinationUrl({
    env: c.env,
    fetcher: fetch,
    url,
  });

  if (scan.status === "malicious") {
    return c.json(
      {
        error: "Destination URL was rejected by the abuse scanner.",
        scan,
      },
      400,
    );
  }

  const link = await createLink(db, {
    slug,
    url,
    userId: session.user.id,
    expiresAt,
    scanStatus: scan.status,
    scanVerdictJson: JSON.stringify(scan.verdict),
  });
  await writeSlugCache(
    c.env.LINKS_KV,
    slug,
    toCachedLink(link, slug, Boolean(session.user.emailVerified)),
  );

  if (browserFormPost) {
    return c.redirect(`/links/${link.slug}`);
  }

  return c.json(
    {
      id: link.id,
      slug: link.slug,
      url: link.url,
      short_url: `${c.env.APP_ORIGIN}/${link.slug}`,
      expires_at: link.expiresAt?.toISOString() ?? null,
      scan_status: link.scanStatus,
    },
    201,
  );
});
