import type { LinkRecord } from "./repository";

export type CachedLink = {
  slug?: string;
  url: string;
  disabled: boolean;
  expires_at: number | null;
  owner_verified: boolean;
};

const CACHE_TTL_SECONDS = 300;

export const slugCacheKey = (slug: string) => `slug:${slug}`;

export const toCachedLink = (
  link: Pick<LinkRecord, "url" | "disabledAt" | "expiresAt">,
  slug: string,
  ownerVerified: boolean,
): CachedLink => ({
  slug,
  url: link.url,
  disabled: Boolean(link.disabledAt),
  expires_at: link.expiresAt?.getTime() ?? null,
  owner_verified: ownerVerified,
});

export const writeSlugCache = (
  kv: KVNamespace,
  slug: string,
  cachedLink: CachedLink,
) =>
  kv.put(slugCacheKey(slug), JSON.stringify(cachedLink), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
