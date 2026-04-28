import { createDb } from "../db/client";
import {
  type CachedLink,
  slugCacheKey,
  toCachedLink,
  writeSlugCache,
} from "../links/cache";
import { getLinkBySlug } from "../links/repository";
import { readTheme } from "../theme";
import type { AppContext } from "../types";
import { linkStatusPage } from "../views/link-status";

const isExpired = (expiresAt: number | null) =>
  expiresAt !== null && expiresAt <= Date.now();

const renderNotFound = (c: AppContext) =>
  c.html(
    linkStatusPage({
      title: "Link not found",
      message: "That short link does not exist or has been removed.",
      theme: readTheme(c),
    }),
    404,
  );

const renderExpired = (c: AppContext) =>
  c.html(
    linkStatusPage({
      title: "Link expired",
      message: "That short link has expired and no longer redirects.",
      theme: readTheme(c),
    }),
    410,
  );

const renderDisabled = (c: AppContext) =>
  c.html(
    linkStatusPage({
      title: "Link disabled",
      message: "That short link has been disabled for safety or policy review.",
      theme: readTheme(c),
    }),
    410,
  );

const redirectCachedLink = (c: AppContext, cachedLink: CachedLink) => {
  if (cachedLink.disabled) {
    return renderDisabled(c);
  }

  if (isExpired(cachedLink.expires_at)) {
    return renderExpired(c);
  }

  return c.redirect(cachedLink.url, 302);
};

export const handleRedirect = async (c: AppContext) => {
  const slug = c.req.param("slug");

  if (!slug) {
    return renderNotFound(c);
  }

  const cachedLink = await c.env.LINKS_KV.get<CachedLink>(
    slugCacheKey(slug),
    "json",
  );

  if (cachedLink) {
    return redirectCachedLink(c, cachedLink);
  }

  const link = await getLinkBySlug(createDb(c.env.DB), slug);

  if (!link) {
    return renderNotFound(c);
  }

  const ownerVerified = true;
  const nextCachedLink = toCachedLink(link, ownerVerified);
  await writeSlugCache(c.env.LINKS_KV, slug, nextCachedLink);

  return redirectCachedLink(c, nextCachedLink);
};
