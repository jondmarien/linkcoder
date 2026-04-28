import { createMiddleware } from "hono/factory";
import { promoteAdminIfConfigured } from "../admin/auth";
import { createDb } from "../db/client";
import type { AppEnv } from "../env";
import { createAuth } from ".";

type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;

export type AppVariables = {
  session: Session;
};

const shouldLoadSession = (path: string) =>
  path === "/" ||
  path === "/dashboard" ||
  path === "/login" ||
  path === "/signup" ||
  path.startsWith("/links") ||
  path.startsWith("/api/links") ||
  path.startsWith("/api/analytics") ||
  path.startsWith("/admin");

export const sessionMiddleware = createMiddleware<{
  Bindings: AppEnv;
  Variables: AppVariables;
}>(async (c, next) => {
  if (!shouldLoadSession(c.req.path) || !c.env?.DB || !c.env.APP_ORIGIN) {
    return next();
  }

  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  c.set("session", session);
  await promoteAdminIfConfigured({
    db: createDb(c.env.DB),
    env: c.env,
    user: session?.user,
  });

  return next();
});

export const requireSession = createMiddleware<{
  Bindings: AppEnv;
  Variables: AppVariables;
}>(async (c, next) => {
  if (!c.get("session")) {
    return c.redirect("/login");
  }

  return next();
});
