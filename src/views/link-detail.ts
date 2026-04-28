import type {
  AnalyticsAggregate,
  AnalyticsTimeseriesPoint,
} from "../analytics/query";
import type { LinkRecord } from "../links/repository";
import { scanDisplay } from "../links/scan-status";
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

const chartWidth = 640;
const chartHeight = 240;
const chartPadding = {
  bottom: 34,
  left: 42,
  right: 18,
  top: 18,
};

const formatClickCount = (clicks: number) =>
  `${clicks} total ${clicks === 1 ? "click" : "clicks"} recorded`;

const chartX = (index: number, count: number) => {
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;

  if (count <= 1) {
    return chartPadding.left + plotWidth / 2;
  }

  return chartPadding.left + (plotWidth * index) / (count - 1);
};

const chartY = (clicks: number, maxClicks: number) => {
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  return chartPadding.top + plotHeight - (plotHeight * clicks) / maxClicks;
};

const clickChart = ({
  aggregate,
  timeseries,
}: {
  aggregate: AnalyticsAggregate;
  timeseries: AnalyticsTimeseriesPoint[];
}) => {
  const hasHourlyData = timeseries.length > 0;
  const points = hasHourlyData
    ? [...timeseries].sort((a, b) => a.t - b.t)
    : [
        { clicks: 0, t: 0 },
        { clicks: 0, t: 1 },
        { clicks: 0, t: 2 },
        { clicks: 0, t: 3 },
        { clicks: 0, t: 4 },
        { clicks: 0, t: 5 },
        { clicks: 0, t: 6 },
      ];
  const maxClicks = Math.max(1, ...points.map((point) => point.clicks));
  const path = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${chartX(index, points.length).toFixed(1)} ${chartY(point.clicks, maxClicks).toFixed(1)}`;
    })
    .join(" ");
  const grid = [0, 1, 2, 3].map((index) => {
    const y =
      chartPadding.top +
      ((chartHeight - chartPadding.top - chartPadding.bottom) * index) / 3;

    return `<line x1="${chartPadding.left}" y1="${y.toFixed(1)}" x2="${chartWidth - chartPadding.right}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="0.12" />`;
  });
  const markers = hasHourlyData
    ? points
        .map(
          (point, index) =>
            `<circle cx="${chartX(index, points.length).toFixed(1)}" cy="${chartY(point.clicks, maxClicks).toFixed(1)}" r="3" fill="currentColor" />`,
        )
        .join("")
    : "";

  return `<figure data-chart-state="${hasHourlyData ? "ready" : "empty"}" class="rounded-lg border bg-background p-4">
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="h-64 w-full text-foreground" role="img" aria-label="Clicks over time chart">
      <title>Clicks over time</title>
      <desc>${hasHourlyData ? "Hourly click counts for the last seven days." : "No hourly click data is available yet."}</desc>
      <g class="text-muted-foreground">
        ${grid.join("")}
        <line x1="${chartPadding.left}" y1="${chartHeight - chartPadding.bottom}" x2="${chartWidth - chartPadding.right}" y2="${chartHeight - chartPadding.bottom}" stroke="currentColor" stroke-opacity="0.35" />
        <line x1="${chartPadding.left}" y1="${chartPadding.top}" x2="${chartPadding.left}" y2="${chartHeight - chartPadding.bottom}" stroke="currentColor" stroke-opacity="0.2" />
        <text x="${chartPadding.left}" y="${chartHeight - 8}" fill="currentColor" font-size="12">7 days ago</text>
        <text x="${chartWidth - chartPadding.right}" y="${chartHeight - 8}" fill="currentColor" font-size="12" text-anchor="end">now</text>
        <text x="10" y="${chartPadding.top + 4}" fill="currentColor" font-size="12">${maxClicks}</text>
        <text x="16" y="${chartHeight - chartPadding.bottom + 4}" fill="currentColor" font-size="12">0</text>
      </g>
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      ${markers}
      ${
        hasHourlyData
          ? ""
          : `<g class="text-muted-foreground">
            <text x="${chartWidth / 2}" y="104" fill="currentColor" font-size="16" text-anchor="middle">No hourly data yet</text>
            <text x="${chartWidth / 2}" y="128" fill="currentColor" font-size="13" text-anchor="middle">${formatClickCount(aggregate.clicks ?? 0)}</text>
          </g>`
      }
    </svg>
  </figure>`;
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
  const status = scanDisplay(link);

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
        <div class="grid gap-4">
          <div class="${cardClass()}">
            <div class="px-6">
              <p class="text-sm text-muted-foreground">Clicks</p>
              <p class="mt-2 text-3xl font-semibold">${aggregate.clicks ?? 0}</p>
            </div>
          </div>
          <div class="${cardClass()}">
            <div class="grid gap-4 px-6">
              <div>
                <p class="text-sm text-muted-foreground">Scan status</p>
                <p class="mt-2 text-2xl font-semibold">${escapeHtml(status.label)}</p>
                <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(status.detail)}</p>
                ${status.estimate ? `<p class="mt-2 text-sm text-muted-foreground">${escapeHtml(status.estimate)}</p>` : ""}
              </div>
              <form method="post" action="/links/${escapeAttribute(link.slug)}/rescan">
                <button class="${buttonClass("secondary", "sm")}" type="submit">Re-scan</button>
              </form>
            </div>
          </div>
        </div>
        <div class="${cardClass("md:col-span-2")}">
          <div class="space-y-4 px-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">Clicks over time</p>
                <p class="text-sm text-muted-foreground">Hourly clicks from Analytics Engine.</p>
              </div>
            </div>
            ${clickChart({ aggregate, timeseries })}
          </div>
        </div>
      </section>
      <script>
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
