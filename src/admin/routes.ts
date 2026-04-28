import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { createDb } from "../db/client";
import { readTheme } from "../theme";
import type { HonoAppEnv } from "../types";
import { adminReviewPage } from "../views/admin";
import { getUserRole } from "./auth";
import { approveLink, disableLink, getReviewQueue } from "./review";

export const adminRoutes = new Hono<HonoAppEnv>();

const requireAdmin = createMiddleware<HonoAppEnv>(async (c, next) => {
  const session = c.get("session");

  if (!session) {
    return c.redirect("/login");
  }

  const role = await getUserRole(createDb(c.env.DB), session.user.id);

  if (role !== "admin") {
    return c.text("Forbidden", 403);
  }

  return next();
});

adminRoutes.use("/admin/*", requireAdmin);

adminRoutes.get("/admin/review", async (c) => {
  const items = await getReviewQueue(createDb(c.env.DB));

  return c.html(adminReviewPage({ items, theme: readTheme(c) }));
});

adminRoutes.post("/admin/review/:slug/disable", async (c) => {
  await disableLink(
    createDb(c.env.DB),
    c.env.LINKS_KV,
    c.req.param("slug"),
    "admin_disabled",
  );

  return c.redirect("/admin/review");
});

adminRoutes.post("/admin/review/:slug/approve", async (c) => {
  await approveLink(createDb(c.env.DB), c.env.LINKS_KV, c.req.param("slug"));

  return c.redirect("/admin/review");
});
