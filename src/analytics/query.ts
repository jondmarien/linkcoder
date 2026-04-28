import type { AppEnv } from "../env";

type AnalyticsDataset = {
  writeDataPoint: (point: {
    blobs: string[];
    doubles: number[];
    indexes: string[];
  }) => void;
};

type WriteClickEventOptions = {
  dataset: AnalyticsDataset;
  request: Request;
  slug: string;
};

type QueryAnalyticsEngineOptions = {
  accountId: string;
  apiToken: string;
  fetcher: typeof fetch;
  sql: string;
};

export type AnalyticsAggregate = {
  clicks: number;
};

export type AnalyticsTimeseriesPoint = {
  t: number;
  clicks: number;
};

const escapeSqlString = (value: string) => value.replaceAll("'", "''");

const referrerHost = (request: Request) => {
  const referrer = request.headers.get("referer");

  if (!referrer) {
    return "direct";
  }

  try {
    return new URL(referrer).hostname;
  } catch {
    return "unknown";
  }
};

const userAgentFamily = (request: Request) =>
  request.headers.get("user-agent") ? "browser" : "unknown";

export const writeClickEvent = ({
  dataset,
  request,
  slug,
}: WriteClickEventOptions) => {
  dataset.writeDataPoint({
    blobs: [
      slug,
      request.headers.get("cf-ipcountry") ?? "unknown",
      referrerHost(request),
      userAgentFamily(request),
      "unknown",
    ],
    doubles: [1],
    indexes: [slug],
  });
};

export const buildLinkAggregateQuery = (slug: string) => {
  const escapedSlug = escapeSqlString(slug);

  return `SELECT SUM(_sample_interval * double1) AS clicks FROM analytic_events WHERE blob1 = '${escapedSlug}' FORMAT JSON`;
};

export const buildLinkTimeseriesQuery = (slug: string) => {
  const escapedSlug = escapeSqlString(slug);

  return `SELECT intDiv(toUInt32(timestamp), 3600) * 3600 AS t, SUM(_sample_interval * double1) AS clicks FROM analytic_events WHERE blob1 = '${escapedSlug}' AND timestamp > NOW() - INTERVAL '7' DAY GROUP BY t ORDER BY t FORMAT JSON`;
};

export const queryAnalyticsEngine = async ({
  accountId,
  apiToken,
  fetcher,
  sql,
}: QueryAnalyticsEngineOptions) => {
  const response = await fetcher(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
      body: sql,
    },
  );

  if (!response.ok) {
    throw new Error(`Analytics Engine query failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { data?: unknown[] };
  return payload.data ?? [];
};

export const queryLinkAnalytics = async (
  env: AppEnv,
  slug: string,
  fetcher: typeof fetch = fetch,
) => {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.ANALYTICS_API_TOKEN) {
    return {
      aggregate: { clicks: 0 },
      timeseries: [] as AnalyticsTimeseriesPoint[],
      available: false,
    };
  }

  const [aggregateRows, timeseriesRows] = await Promise.all([
    queryAnalyticsEngine({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.ANALYTICS_API_TOKEN,
      fetcher,
      sql: buildLinkAggregateQuery(slug),
    }),
    queryAnalyticsEngine({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.ANALYTICS_API_TOKEN,
      fetcher,
      sql: buildLinkTimeseriesQuery(slug),
    }),
  ]);
  const aggregate = (aggregateRows[0] as AnalyticsAggregate | undefined) ?? {
    clicks: 0,
  };

  return {
    aggregate,
    timeseries: timeseriesRows as AnalyticsTimeseriesPoint[],
    available: true,
  };
};
