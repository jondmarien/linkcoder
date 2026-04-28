import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { escapeAttribute, escapeHtml } from "./html";

type LayoutUser = {
  email?: string | null;
  name?: string | null;
};

type PageMeta = {
  description?: string;
  image?: string;
  imageAlt?: string;
  title?: string;
  type?: "website" | "article";
  url?: string;
};

type LayoutOptions = {
  title: string;
  theme: Theme;
  body: string;
  meta?: PageMeta;
  user?: LayoutUser | null;
};

const themeToggle = (theme: Theme) => {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Switch to light" : "Switch to dark";

  return `<form method="post" action="/theme" data-theme-toggle>
    <input type="hidden" name="theme" value="${nextTheme}">
    <button class="${buttonClass("ghost", "icon")}" aria-label="${label}" title="${label}">
      <span aria-hidden="true">${theme === "dark" ? "Moon" : "Sun"}</span>
    </button>
  </form>`;
};

const accountNav = (user?: LayoutUser | null) => {
  if (!user) {
    return `<a class="${buttonClass("outline", "sm")}" href="/login">Log in</a>`;
  }

  const label = user.name || user.email || "Account";
  const title = user.email || label;

  return `<span class="max-w-48 truncate rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground" title="${escapeAttribute(title)}">${escapeHtml(label)}</span>`;
};

const metaTags = (meta?: PageMeta) => {
  if (!meta) {
    return "";
  }

  const title = meta.title;

  return [
    meta.description
      ? `<meta name="description" content="${escapeAttribute(meta.description)}">`
      : "",
    meta.url
      ? `<link rel="canonical" href="${escapeAttribute(meta.url)}">`
      : "",
    title
      ? `<meta property="og:title" content="${escapeAttribute(title)}">`
      : "",
    meta.description
      ? `<meta property="og:description" content="${escapeAttribute(meta.description)}">`
      : "",
    meta.url
      ? `<meta property="og:url" content="${escapeAttribute(meta.url)}">`
      : "",
    `<meta property="og:site_name" content="chron0 links">`,
    `<meta property="og:type" content="${escapeAttribute(meta.type ?? "website")}">`,
    meta.image
      ? `<meta property="og:image" content="${escapeAttribute(meta.image)}">`
      : "",
    meta.image ? `<meta property="og:image:type" content="image/svg+xml">` : "",
    meta.image ? `<meta property="og:image:width" content="1200">` : "",
    meta.image ? `<meta property="og:image:height" content="630">` : "",
    meta.imageAlt
      ? `<meta property="og:image:alt" content="${escapeAttribute(meta.imageAlt)}">`
      : "",
    meta.image
      ? `<meta name="twitter:card" content="summary_large_image">`
      : "",
    title
      ? `<meta name="twitter:title" content="${escapeAttribute(title)}">`
      : "",
    meta.description
      ? `<meta name="twitter:description" content="${escapeAttribute(meta.description)}">`
      : "",
    meta.image
      ? `<meta name="twitter:image" content="${escapeAttribute(meta.image)}">`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");
};

export const page = ({
  title,
  theme,
  body,
  meta,
  user,
}: LayoutOptions) => `<!doctype html>
<html lang="en" class="${theme === "dark" ? "dark" : ""}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <title>${escapeHtml(title)} - chron0 links</title>
    ${metaTags(meta)}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body class="min-h-screen bg-background text-foreground">
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
      <header class="flex items-center justify-between border-b py-5">
        <a class="font-mono text-sm font-semibold tracking-tight" href="/">chron0 links</a>
        <nav class="flex items-center gap-3 text-sm">
          <a class="text-muted-foreground transition hover:text-foreground" href="/dashboard">Dashboard</a>
          ${accountNav(user)}
          ${themeToggle(theme)}
        </nav>
      </header>
      ${body}
    </div>
  </body>
</html>`;
