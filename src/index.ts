import { Hono } from "hono";
import { adminRoutes } from "./admin/routes";
import { analyticsRoutes } from "./analytics/routes";
import {
  type AppVariables,
  requireSession,
  sessionMiddleware,
} from "./auth/middleware";
import { authRoutes } from "./auth/routes";
import { scheduled } from "./cron";
import { createDb } from "./db/client";
import type { AppEnv } from "./env";
import { listLinksByUser } from "./links/repository";
import { linkRoutes } from "./links/routes";
import { handleRedirect } from "./redirect/handler";
import { reportRoutes } from "./reports/routes";
import { readTheme, writeTheme } from "./theme";
import { loginPage, signupPage, verifyPage } from "./views/auth";
import { dashboardPage } from "./views/dashboard";
import { landingPage } from "./views/landing";
import {
  helpPage,
  privacyPage,
  robotsTxt,
  sitemapXml,
  termsPage,
} from "./views/static-pages";

const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();

app.use("*", sessionMiddleware);
app.use("*", async (c, next) => {
  await next();

  if (c.res.headers.get("content-type")?.includes("text/html")) {
    c.header("cache-control", "private, no-transform");
  }
});

app.get("/", (c) =>
  c.html(
    landingPage({
      appOrigin: c.env?.APP_ORIGIN ?? "https://link.chron0.tech",
      theme: readTheme(c),
      user: c.get("session")?.user,
    }),
  ),
);
app.get("/healthz", (c) => c.json({ ok: true }));
app.get("/login", (c) =>
  c.get("session")
    ? c.redirect("/dashboard")
    : c.html(loginPage({ theme: readTheme(c) })),
);
app.get("/signup", (c) =>
  c.get("session")
    ? c.redirect("/dashboard")
    : c.html(signupPage({ theme: readTheme(c) })),
);
app.get("/verify", (c) => c.html(verifyPage({ theme: readTheme(c) })));
app.get("/terms", (c) => c.html(termsPage({ theme: readTheme(c) })));
app.get("/privacy", (c) => c.html(privacyPage({ theme: readTheme(c) })));
app.get("/help", (c) => c.html(helpPage({ theme: readTheme(c) })));
app.get("/robots.txt", (c) => c.text(robotsTxt));
app.get("/sitemap.xml", (c) =>
  c.body(sitemapXml, 200, { "content-type": "application/xml; charset=utf-8" }),
);
app.post("/theme", async (c) => {
  const body = await c.req.parseBody();
  writeTheme(c, body.theme === "dark" ? "dark" : "light");
  return c.redirect(c.req.header("referer") ?? "/");
});
app.get("/dashboard", requireSession, async (c) => {
  const session = c.get("session");

  if (!session) {
    return c.redirect("/login");
  }

  const links = await listLinksByUser(createDb(c.env.DB), session.user.id);
  return c.html(
    dashboardPage({
      appOrigin: c.env.APP_ORIGIN,
      links,
      theme: readTheme(c),
      user: session.user,
    }),
  );
});

app.route("/", authRoutes);
app.route("/", adminRoutes);
app.route("/", linkRoutes);
app.route("/", analyticsRoutes);
app.route("/", reportRoutes);
app.get("/:slug", handleRedirect);

export default Object.assign(app, { scheduled });
