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
  const sunClass = theme === "dark" ? "" : "hidden";
  const moonClass = theme === "dark" ? "hidden" : "";

  return `<form method="post" action="/theme" data-theme-toggle>
    <input type="hidden" name="theme" value="${nextTheme}">
    <button class="${buttonClass("ghost", "icon")}" aria-label="${label}" title="${label}">
      <svg data-theme-icon-sun class="${sunClass}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
      <svg data-theme-icon-moon class="${moonClass}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.99 13.37A8 8 0 1 1 10.63 3.01 6.5 6.5 0 0 0 20.99 13.37Z"></path>
      </svg>
    </button>
  </form>`;
};

const themeToggleScript = () => `<script>
  document.querySelectorAll("[data-theme-toggle]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = form.querySelector("input[name='theme']");
      const button = form.querySelector("button");
      const nextTheme = input?.value === "dark" ? "dark" : "light";

      const response = await fetch("/theme", {
        method: "POST",
        body: new FormData(form),
        headers: { "x-theme-toggle": "fetch" },
      });

      if (!response.ok) {
        form.submit();
        return;
      }

      const isDark = nextTheme === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      input.value = isDark ? "light" : "dark";

      const label = isDark ? "Switch to light" : "Switch to dark";
      button?.setAttribute("aria-label", label);
      button?.setAttribute("title", label);
      form.querySelector("[data-theme-icon-sun]")?.classList.toggle("hidden", !isDark);
      form.querySelector("[data-theme-icon-moon]")?.classList.toggle("hidden", isDark);
    });
  });
</script>`;

const accountNav = (user?: LayoutUser | null) => {
  if (!user) {
    return `<a class="${buttonClass("outline", "sm")}" href="/login">Log in</a>`;
  }

  const label = user.name || user.email || "Account";
  const title = user.email || label;

  return `<details class="relative" data-account-menu>
    <summary class="flex max-w-48 cursor-pointer list-none items-center gap-2 truncate rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80" title="${escapeAttribute(title)}">
      <span class="truncate">${escapeHtml(label)}</span>
      <svg aria-hidden="true" class="size-3" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"></path>
      </svg>
    </summary>
    <div class="absolute right-0 z-10 mt-2 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      <div class="truncate px-2 py-1.5 text-xs text-muted-foreground">${escapeHtml(title)}</div>
      <form method="post" action="/logout">
        <button class="w-full rounded-sm px-2 py-1.5 text-left text-sm transition hover:bg-accent hover:text-accent-foreground" type="submit">Log out</button>
      </form>
    </div>
  </details>`;
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
    meta.image ? `<meta property="og:image:type" content="image/png">` : "",
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
    ${themeToggleScript()}
  </body>
</html>`;
