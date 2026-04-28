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
import type { AppEnv } from "./env";
import { linkRoutes } from "./links/routes";
import { handleRedirect } from "./redirect/handler";
import { reportRoutes } from "./reports/routes";
import { readTheme, writeTheme } from "./theme";
import { loginPage, signupPage, verifyPage } from "./views/auth";
import { dashboardPage } from "./views/dashboard";
import { landingPage } from "./views/landing";

const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();

app.use("*", sessionMiddleware);

app.get("/", (c) => c.html(landingPage({ theme: readTheme(c) })));
app.get("/healthz", (c) => c.json({ ok: true }));
app.get("/login", (c) => c.html(loginPage({ theme: readTheme(c) })));
app.get("/signup", (c) => c.html(signupPage({ theme: readTheme(c) })));
app.get("/verify", (c) => c.html(verifyPage({ theme: readTheme(c) })));
app.post("/theme", async (c) => {
  const body = await c.req.parseBody();
  writeTheme(c, body.theme === "dark" ? "dark" : "light");
  return c.redirect(c.req.header("referer") ?? "/");
});
app.get("/dashboard", requireSession, (c) =>
  c.html(dashboardPage({ theme: readTheme(c) })),
);

app.route("/", authRoutes);
app.route("/", adminRoutes);
app.route("/", linkRoutes);
app.route("/", analyticsRoutes);
app.route("/", reportRoutes);
app.get("/:slug", handleRedirect);

export default Object.assign(app, { scheduled });
