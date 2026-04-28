import type {
  AnalyticsAggregate,
  AnalyticsTimeseriesPoint,
} from "../analytics/query";
import type { LinkRecord } from "../links/repository";
import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { inputClass } from "../ui/form";
import { escapeAttribute, escapeHtml } from "./html";
import { page } from "./layout";

type DetailUser = {
  email?: string | null;
  name?: string | null;
};

export const linkDetailPage = ({
  aggregate,
  appOrigin,
  link,
  theme,
  timeseries,
  user,
}: {
  aggregate: AnalyticsAggregate;
  appOrigin: string;
  link: LinkRecord;
  theme: Theme;
  timeseries: AnalyticsTimeseriesPoint[];
  user?: DetailUser | null;
}) => {
  const shortUrl = new URL(`/${link.slug}`, appOrigin).toString();

  return page({
    title: `/${link.slug}`,
    theme,
    user,
    body: `<main class="grid flex-1 gap-8 py-10">
      <section>
        <p class="font-mono text-sm text-muted-foreground">Link detail</p>
        <h1 class="mt-2 text-4xl font-semibold tracking-tight">/${escapeHtml(link.slug)}</h1>
        <p class="mt-3 max-w-2xl break-all text-muted-foreground">${escapeHtml(link.url)}</p>
      </section>
      <section class="${cardClass()}">
        <div class="grid gap-3 px-6">
          <div>
            <p class="font-semibold">Short link</p>
            <p class="text-sm text-muted-foreground">Share this public URL, or copy it to your clipboard.</p>
          </div>
          <div class="grid gap-3 md:grid-cols-[1fr_auto]">
            <input class="${inputClass("font-mono")}" readonly value="${escapeAttribute(shortUrl)}" aria-label="Short URL">
            <button class="${buttonClass("secondary")}" type="button" data-copy="${escapeAttribute(shortUrl)}">Copy short link</button>
          </div>
        </div>
      </section>
      <section class="grid gap-4 md:grid-cols-3">
        <div class="${cardClass()}">
          <div class="px-6">
            <p class="text-sm text-muted-foreground">Clicks</p>
            <p class="mt-2 text-3xl font-semibold">${aggregate.clicks ?? 0}</p>
          </div>
        </div>
        <div class="${cardClass("md:col-span-2")}">
          <div class="space-y-4 px-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">Clicks over time</p>
                <p class="text-sm text-muted-foreground">Powered by Analytics Engine and uPlot.</p>
              </div>
            </div>
            <div id="click-chart" class="h-64 rounded-lg border bg-background"></div>
          </div>
        </div>
      </section>
      <script src="https://cdn.jsdelivr.net/npm/uplot@1.6.32/dist/uPlot.iife.min.js"></script>
      <script>
        window.__LINK_TIMESERIES__ = ${JSON.stringify(timeseries)};
        document.querySelectorAll("[data-copy]").forEach((button) => {
          button.addEventListener("click", async () => {
            const text = button.getAttribute("data-copy") || "";
            await navigator.clipboard.writeText(text);
            const previousLabel = button.textContent;
            button.textContent = "Copied";
            setTimeout(() => {
              button.textContent = previousLabel;
            }, 1600);
          });
        });
      </script>
    </main>`,
  });
};
