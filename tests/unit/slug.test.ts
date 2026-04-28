import { describe, expect, it } from "vitest";
import {
  isReservedSlug,
  isValidCustomSlug,
  normalizeDestinationUrl,
  randomSlug,
} from "../../src/links/slug";

describe("slug helpers", () => {
  it("generates six-character URL-safe slugs", () => {
    const slug = randomSlug();

    expect(slug).toMatch(/^[A-Za-z0-9_-]{6}$/);
  });

  it("blocks reserved slugs case-insensitively", () => {
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("API")).toBe(true);
    expect(isReservedSlug("robots.txt")).toBe(true);
    expect(isReservedSlug("atlas7")).toBe(false);
  });

  it("validates custom slugs", () => {
    expect(isValidCustomSlug("my-link_1")).toBe(true);
    expect(isValidCustomSlug("ab")).toBe(false);
    expect(isValidCustomSlug("dashboard")).toBe(false);
    expect(isValidCustomSlug("has space")).toBe(false);
  });

  it("normalizes only http and https destination URLs", () => {
    expect(normalizeDestinationUrl(" example.com/path ")).toBe(
      "https://example.com/path",
    );
    expect(normalizeDestinationUrl("http://example.com")).toBe(
      "http://example.com/",
    );
    expect(() => normalizeDestinationUrl("javascript:alert(1)")).toThrow(
      "Only HTTP and HTTPS URLs are supported.",
    );
  });
});
