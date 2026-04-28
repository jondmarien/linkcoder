import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { escapeAttribute, escapeHtml } from "./html";

type LayoutUser = {
  email?: string | null;
  name?: string | null;
};

type LayoutOptions = {
  title: string;
  theme: Theme;
  body: string;
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

export const page = ({
  title,
  theme,
  body,
  user,
}: LayoutOptions) => `<!doctype html>
<html lang="en" class="${theme === "dark" ? "dark" : ""}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <title>${escapeHtml(title)} - chron0 links</title>
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
