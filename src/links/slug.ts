const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";
const DEFAULT_LENGTH = 6;

const RESERVED_SLUGS = new Set(
  [
    "api",
    "app",
    "dashboard",
    "login",
    "signup",
    "signin",
    "signout",
    "logout",
    "register",
    "account",
    "settings",
    "admin",
    "terms",
    "privacy",
    "about",
    "contact",
    "help",
    "docs",
    "status",
    "report",
    "abuse",
    "healthz",
    "robots.txt",
    "sitemap.xml",
    "favicon.ico",
    ".well-known",
    "assets",
    "static",
    "public",
    "link",
    "links",
    "new",
    "edit",
    "delete",
    "qr",
    "verify",
  ].map((slug) => slug.toLowerCase()),
);

export const randomSlug = (length = DEFAULT_LENGTH) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
};

export const isReservedSlug = (slug: string) =>
  RESERVED_SLUGS.has(slug.toLowerCase());

export const isValidCustomSlug = (slug: string) =>
  /^[A-Za-z0-9_-]{3,64}$/.test(slug) && !isReservedSlug(slug);

export const normalizeDestinationUrl = (value: string) => {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  return url.toString();
};
