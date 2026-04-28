import { Hono } from "hono";
import {
  type AppVariables,
  requireSession,
  sessionMiddleware,
} from "./auth/middleware";
import { authRoutes } from "./auth/routes";
import type { AppEnv } from "./env";
import { loginPage, signupPage, verifyPage } from "./views/auth";

const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();

app.use("*", sessionMiddleware);

app.get("/", (c) => c.text("Hello from chron0 link shortener."));
app.get("/healthz", (c) => c.json({ ok: true }));
app.get("/login", (c) => c.html(loginPage()));
app.get("/signup", (c) => c.html(signupPage()));
app.get("/verify", (c) => c.html(verifyPage()));
app.get("/dashboard", requireSession, (c) =>
  c.html(
    "<!doctype html><title>Dashboard - chron0 links</title><h1>Dashboard</h1>",
  ),
);

app.route("/", authRoutes);

export default app;
