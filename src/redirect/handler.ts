import { writeClickEvent } from "../analytics/query";
import { createDb } from "../db/client";
import {
  type CachedLink,
  slugCacheKey,
  toCachedLink,
  writeSlugCache,
} from "../links/cache";
import {
  getLinkWithOwnerBySlug,
  incrementLinkClicks,
} from "../links/repository";
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

const renderAwaitingVerification = (c: AppContext) =>
  c.html(
    linkStatusPage({
      title: "Link awaiting verification",
      message:
        "This link is awaiting verification. The owner needs to verify their email before redirects are enabled.",
      theme: readTheme(c),
    }),
    403,
  );

const redirectCachedLink = async (
  c: AppContext,
  slug: string,
  cachedLink: CachedLink,
) => {
  if (!cachedLink.owner_verified) {
    return renderAwaitingVerification(c);
  }

  if (cachedLink.disabled) {
    return renderDisabled(c);
  }

  if (isExpired(cachedLink.expires_at)) {
    return renderExpired(c);
  }

  const resolvedSlug = cachedLink.slug ?? slug;
  await incrementLinkClicks(createDb(c.env.DB), resolvedSlug);
  writeClickEvent({
    dataset: c.env.ANALYTICS_ENGINE,
    request: c.req.raw,
    slug: resolvedSlug,
  });

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
    return redirectCachedLink(c, slug, cachedLink);
  }

  const link = await getLinkWithOwnerBySlug(createDb(c.env.DB), slug);

  if (!link) {
    return renderNotFound(c);
  }

  const nextCachedLink = toCachedLink(link, slug, link.ownerVerified);
  await writeSlugCache(c.env.LINKS_KV, slug, nextCachedLink);

  return redirectCachedLink(c, slug, nextCachedLink);
};
