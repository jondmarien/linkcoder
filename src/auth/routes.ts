import { Hono } from "hono";
import type { AppEnv } from "../env";
import { createAuth } from ".";

export const authRoutes = new Hono<{ Bindings: AppEnv }>();

const requestOrigin = (request: Request) => new URL(request.url).origin;

const createJsonRequest = ({
  body,
  request,
  url,
}: {
  body: Record<string, unknown>;
  request: Request;
  url: string;
}) => {
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");

  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

const copySetCookieHeaders = (from: Response, to: Response) => {
  const sourceHeaders = from.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = sourceHeaders.getSetCookie?.() ?? [];

  if (cookies.length > 0) {
    for (const cookie of cookies) {
      to.headers.append("set-cookie", cookie);
    }

    return to;
  }

  const cookie = from.headers.get("set-cookie");

  if (cookie) {
    to.headers.append("set-cookie", cookie);
  }

  return to;
};

authRoutes.post("/api/auth/sign-in/magic-link", async (c) => {
  const contentType = c.req.header("content-type") ?? "";

  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return createAuth(c.env, requestOrigin(c.req.raw)).handler(c.req.raw);
  }

  const form = await c.req.formData();
  const response = await createAuth(c.env, requestOrigin(c.req.raw)).handler(
    createJsonRequest({
      request: c.req.raw,
      url: c.req.url,
      body: {
        email: String(form.get("email") ?? ""),
        name: String(form.get("name") ?? "") || undefined,
        callbackURL: String(form.get("callbackURL") ?? "/dashboard"),
      },
    }),
  );

  if (!response.ok) {
    return response;
  }

  return c.redirect("/verify");
});

authRoutes.get("/api/auth/sign-in/google", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.text("Google sign-in is not configured.", 503);
  }

  const response = await createAuth(c.env, requestOrigin(c.req.raw)).handler(
    createJsonRequest({
      request: c.req.raw,
      url: `${requestOrigin(c.req.raw)}/api/auth/sign-in/social`,
      body: {
        provider: "google",
        callbackURL: "/dashboard",
      },
    }),
  );

  if (!response.ok) {
    return response;
  }

  const payload = (await response.json()) as { url?: string };

  if (!payload.url) {
    return c.text("Google sign-in did not return a redirect URL.", 502);
  }

  return copySetCookieHeaders(response, c.redirect(payload.url));
});

authRoutes.post("/logout", async (c) => {
  const origin = c.env.APP_ORIGIN ?? requestOrigin(c.req.raw);
  const headers = new Headers(c.req.raw.headers);
  headers.set("origin", origin);
  const response = await createAuth(c.env, origin).handler(
    new Request(`${origin}/api/auth/sign-out`, {
      method: "POST",
      headers,
    }),
  );

  if (!response.ok) {
    return response;
  }

  return copySetCookieHeaders(response, c.redirect("/"));
});

authRoutes.on(["GET", "POST"], "/api/auth/*", (c) =>
  createAuth(c.env, requestOrigin(c.req.raw)).handler(c.req.raw),
);
