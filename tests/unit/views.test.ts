import { describe, expect, it } from "vitest";
import type { LinkRecord } from "../../src/links/repository";
import { dashboardPage } from "../../src/views/dashboard";
import { linkDetailPage } from "../../src/views/link-detail";
import { newLinkPage } from "../../src/views/new-link";

const link = (overrides: Partial<LinkRecord> = {}): LinkRecord => ({
  clickCount: 1,
  createdAt: new Date("2026-04-28T18:00:00Z"),
  disabledAt: null,
  disabledReason: null,
  expiresAt: null,
  id: "link-id",
  lastScannedAt: new Date("2026-04-28T18:00:00Z"),
  scanStatus: "clean",
  scanVerdictJson: null,
  slug: "atlas7",
  url: "https://example.com/",
  userId: "user-id",
  ...overrides,
});

describe("dashboard view", () => {
  it("renders a link management skeleton", () => {
    const html = dashboardPage({
      appOrigin: "https://link.chron0.tech",
      links: [
        link({
          clickCount: 0,
          scanStatus: "clean",
        }),
      ],
      theme: "light",
    }).toString();

    expect(html).toContain("Your links");
    expect(html).toContain("Create a short link");
    expect(html).toContain("Clicks");
    expect(html).toContain("Expires");
    expect(html).toContain("No expiration");
  });

  it("labels pending scanner results as reviewing with an estimate", () => {
    const html = dashboardPage({
      appOrigin: "https://link.chron0.tech",
      links: [
        link({
          scanStatus: "pending",
          scanVerdictJson: JSON.stringify({ reason: "scan_pending" }),
        }),
      ],
      theme: "light",
    }).toString();

    expect(html).toContain("Reviewing");
    expect(html).toContain("Estimated finish");
    expect(html).not.toContain(">suspicious<");
  });
});

describe("link detail view", () => {
  it("renders a visible SVG click chart even without timeseries data", () => {
    const html = linkDetailPage({
      aggregate: { clicks: 1 },
      appOrigin: "https://link.chron0.tech",
      link: link(),
      theme: "dark",
      timeseries: [],
    }).toString();

    expect(html).toContain('data-chart-state="empty"');
    expect(html).toContain("<svg");
    expect(html).toContain("No hourly data yet");
    expect(html).toContain("1 total click recorded");
    expect(html).not.toContain("uPlot");
  });

  it("renders scan status details and a rescan action", () => {
    const html = linkDetailPage({
      aggregate: { clicks: 0 },
      appOrigin: "https://link.chron0.tech",
      link: link({
        scanStatus: "pending",
        scanVerdictJson: JSON.stringify({ reason: "scan_pending" }),
      }),
      theme: "dark",
      timeseries: [],
    }).toString();

    expect(html).toContain("Reviewing");
    expect(html).toContain("Estimated finish");
    expect(html).toContain('action="/links/atlas7/rescan"');
    expect(html).toContain("Re-scan");
  });
});

describe("new link view", () => {
  it("makes expiration opt-in with a two-week default", () => {
    const html = newLinkPage({ theme: "dark" }).toString();

    expect(html).toContain("Set expiration");
    expect(html).toContain(
      "Optional. If enabled, defaults to two weeks from now.",
    );
    expect(html).toContain("data-expiration-toggle");
    expect(html).toContain('data-default-expiration="');
    expect(html).toContain('name="expires_at" type="datetime-local"');
    expect(html).toContain("disabled");
  });
});
