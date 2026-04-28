import { Hono } from "hono";
import { createDb } from "../db/client";
import { getLinkBySlug, type LinkRecord } from "../links/repository";
import { readTheme } from "../theme";
import type { AppContext, HonoAppEnv } from "../types";
import { linkDetailPage } from "../views/link-detail";
import { queryLinkAnalytics } from "./query";

export const analyticsRoutes = new Hono<HonoAppEnv>();

type OwnedLinkResult =
  | { response: Response }
  | { link: LinkRecord; slug: string };

const getOwnedLink = async (c: AppContext): Promise<OwnedLinkResult> => {
  const session = c.get("session");
  const slug = c.req.param("slug");

  if (!session) {
    return { response: c.json({ error: "Authentication required." }, 401) };
  }

  if (!slug) {
    return { response: c.json({ error: "Slug is required." }, 400) };
  }

  const link = await getLinkBySlug(createDb(c.env.DB), slug);

  if (!link || link.userId !== session.user.id) {
    return { response: c.json({ error: "Link not found." }, 404) };
  }

  return { link, slug };
};

analyticsRoutes.get("/api/analytics/:slug", async (c) => {
  const result = await getOwnedLink(c);

  if ("response" in result) {
    return result.response;
  }

  const analytics = await queryLinkAnalytics(c.env, result.slug);
  return c.json(analytics);
});

analyticsRoutes.get("/links/:slug", async (c) => {
  const result = await getOwnedLink(c);

  if ("response" in result) {
    const response = result.response;

    if (response.status === 401) {
      return c.redirect("/login");
    }

    return response;
  }

  const analytics = await queryLinkAnalytics(c.env, result.slug);
  return c.html(
    linkDetailPage({
      aggregate: analytics.aggregate,
      link: result.link,
      theme: readTheme(c),
      timeseries: analytics.timeseries,
    }),
  );
});
