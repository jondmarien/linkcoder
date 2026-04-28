import { describe, expect, it } from "vitest";
import {
  buildLinkAggregateQuery,
  buildLinkTimeseriesQuery,
  queryAnalyticsEngine,
  writeClickEvent,
} from "../../src/analytics/query";

describe("analytics", () => {
  it("writes redirect click events with slug as the Analytics Engine index", () => {
    const points: unknown[] = [];

    writeClickEvent({
      dataset: {
        writeDataPoint: (point: unknown) => points.push(point),
      },
      request: new Request("https://link.chron0.tech/demo", {
        headers: {
          "cf-ipcountry": "CA",
          referer: "https://example.com/path",
          "user-agent": "Mozilla/5.0",
        },
      }),
      slug: "demo",
    });

    expect(points).toEqual([
      {
        blobs: ["demo", "CA", "example.com", "browser", "unknown"],
        doubles: [1],
        indexes: ["demo"],
      },
    ]);
  });

  it("builds aggregate and timeseries SQL scoped to one slug", () => {
    expect(buildLinkAggregateQuery("abc123")).toContain("FROM analytic_events");
    expect(buildLinkAggregateQuery("abc123")).toContain("blob1 = 'abc123'");
    expect(buildLinkTimeseriesQuery("abc123")).toContain("GROUP BY t");
  });

  it("queries the Analytics Engine SQL API as JSON", async () => {
    const fetcher = async (_input: RequestInfo | URL, init?: RequestInit) =>
      Response.json({
        query: init?.body,
        data: [{ clicks: 2 }],
      });

    const result = await queryAnalyticsEngine({
      accountId: "account",
      apiToken: "token",
      fetcher,
      sql: "SELECT 1",
    });

    expect(result).toEqual([{ clicks: 2 }]);
  });
});
