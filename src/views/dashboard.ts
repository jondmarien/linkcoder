import type { LinkRecord } from "../links/repository";
import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { inputClass, labelClass } from "../ui/form";
import { escapeAttribute, escapeHtml } from "./html";
import { page } from "./layout";

type DashboardUser = {
  email?: string | null;
  name?: string | null;
};

type DashboardLink = Pick<
  LinkRecord,
  "clickCount" | "disabledAt" | "expiresAt" | "scanStatus" | "slug" | "url"
>;

const shortUrlFor = (appOrigin: string, slug: string) =>
  new URL(`/${slug}`, appOrigin).toString();

const formatExpiration = (expiresAt: Date | null) =>
  expiresAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(expiresAt)
    : "No expiration";

const statusLabel = (link: DashboardLink) => {
  if (link.disabledAt) {
    return "Disabled";
  }

  return link.scanStatus === "clean" ? "Ready" : link.scanStatus;
};

const linkRows = (links: DashboardLink[], appOrigin: string) => {
  if (links.length === 0) {
    return `<div class="px-6 py-8 text-sm text-muted-foreground">No links yet.</div>`;
  }

  return links
    .map((link) => {
      const shortUrl = shortUrlFor(appOrigin, link.slug);

      return `<div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-6 py-5 text-sm">
        <span class="min-w-0">
          <a class="break-all font-mono hover:underline" href="/links/${escapeAttribute(link.slug)}">${escapeHtml(shortUrl)}</a>
          <span class="mt-2 block break-all text-muted-foreground">${escapeHtml(link.url)}</span>
        </span>
        <span class="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">${escapeHtml(statusLabel(link))}</span>
        <span class="text-muted-foreground">${escapeHtml(formatExpiration(link.expiresAt))}</span>
        <span>${link.clickCount}</span>
      </div>`;
    })
    .join("");
};

export const dashboardPage = ({
  appOrigin,
  links,
  theme,
  user,
}: {
  appOrigin: string;
  links: DashboardLink[];
  theme: Theme;
  user?: DashboardUser | null;
}) =>
  page({
    title: "Dashboard",
    theme,
    user,
    body: `<main class="grid flex-1 gap-8 py-10">
      <section class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="font-mono text-sm text-muted-foreground">Dashboard</p>
          <h1 class="mt-2 text-4xl font-semibold tracking-tight">Your links</h1>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            Create, review, and measure your shortened links from one server-rendered workspace.
          </p>
        </div>
        <a class="${buttonClass("default", "lg")}" href="/links/new">Create a short link</a>
      </section>
      <section class="${cardClass()}">
        <form class="grid gap-4 px-6 md:grid-cols-[1fr_auto] md:items-end" method="post" action="/api/links">
          <div class="grid gap-2">
            <label class="${labelClass()}" for="url">Destination URL</label>
            <input class="${inputClass()}" id="url" name="url" type="url" placeholder="https://example.com/a-long-url" required>
          </div>
          <button class="${buttonClass("secondary")}" type="submit">Create link</button>
        </form>
      </section>
      <section class="${cardClass("overflow-hidden py-0")}">
        <div class="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-6 py-4 text-sm font-medium text-muted-foreground">
          <span>Short link</span>
          <span>Status</span>
          <span>Expires</span>
          <span>Clicks</span>
        </div>
        ${linkRows(links, appOrigin)}
      </section>
    </main>`,
  });
