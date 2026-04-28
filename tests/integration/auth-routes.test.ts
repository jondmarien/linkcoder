import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../../src/index";

const now = Date.now();
const authSecret = "test-only-better-auth-secret-32-characters";

const signedCookieValue = async (value: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return `${value}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
};

const seedAuthenticatedUser = async (id: string) => {
  const token = `${id}-session-token`;
  await env.DB.prepare(
    "INSERT OR REPLACE INTO users (id, email, email_verified, name, role, created_at, updated_at) VALUES (?, ?, 1, ?, 'user', ?, ?)",
  )
    .bind(id, `${id}@example.com`, "Session User", now, now)
    .run();
  await env.DB.prepare(
    "INSERT OR REPLACE INTO sessions (id, expires_at, token, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(`session-${id}`, now + 86_400_000, token, now, now, id)
    .run();

  return {
    cookie: `__Secure-better-auth.session_token=${encodeURIComponent(await signedCookieValue(token))}`,
  };
};

describe("auth routes", () => {
  it("mounts the Better Auth handler under /api/auth/*", async () => {
    const response = await app.request(
      "/api/auth/get-session",
      {
        headers: { accept: "application/json" },
      },
      env,
    );

    expect(response.status).not.toBe(404);
    expect(response.status).toBeLessThan(500);
  });

  it("accepts browser form posts for magic-link sign in", async () => {
    const response = await app.request(
      "/api/auth/sign-in/magic-link",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: "person@example.com",
          callbackURL: "/dashboard",
        }),
      },
      env,
    );

    expect(response.status).not.toBe(415);
    expect(response.status).toBeLessThan(500);
  });

  it("redirects the legacy Google sign-in link through Better Auth social sign-in", async () => {
    const response = await app.request(
      "/api/auth/sign-in/google",
      undefined,
      env,
    );

    expect(response.status).not.toBe(404);
    expect(response.status).toBeLessThan(500);
    expect(response.headers.get("location")).toContain("accounts.google.com");
    expect(response.headers.get("set-cookie")).toContain("state");
  });

  it.each([
    "/login",
    "/signup",
    "/verify",
  ])("renders the %s auth page", async (path) => {
    const response = await app.request(path, undefined, env);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("chron0");
  });

  it("uses an existing landing-page session for the start-shortening CTA", async () => {
    const session = await seedAuthenticatedUser("landing-user");
    const response = await app.request(
      "/",
      { headers: { cookie: session.cookie } },
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Session User");
    expect(html).toContain('href="/links/new">Start shortening</a>');
    expect(html).toContain('href="/dashboard">Dashboard</a>');
    expect(html).not.toContain('href="/signup">Start shortening</a>');
  });

  it.each([
    "/login",
    "/signup",
  ])("redirects signed-in users from %s to the dashboard", async (path) => {
    const session = await seedAuthenticatedUser(`redirect-${path.slice(1)}`);
    const response = await app.request(
      path,
      { headers: { cookie: session.cookie } },
      env,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/dashboard");
  });
});
