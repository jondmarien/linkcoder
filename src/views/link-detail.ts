import type {
  AnalyticsAggregate,
  AnalyticsTimeseriesPoint,
} from "../analytics/query";
import type { LinkRecord } from "../links/repository";
import type { Theme } from "../theme";
import { cardClass } from "../ui/card";
import { page } from "./layout";

export const linkDetailPage = ({
  aggregate,
  link,
  theme,
  timeseries,
}: {
  aggregate: AnalyticsAggregate;
  link: LinkRecord;
  theme: Theme;
  timeseries: AnalyticsTimeseriesPoint[];
}) =>
  page({
    title: `/${link.slug}`,
    theme,
    body: `<main class="grid flex-1 gap-8 py-10">
      <section>
        <p class="font-mono text-sm text-muted-foreground">Link detail</p>
        <h1 class="mt-2 text-4xl font-semibold tracking-tight">/${link.slug}</h1>
        <p class="mt-3 max-w-2xl break-all text-muted-foreground">${link.url}</p>
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
      </script>
    </main>`,
  });
