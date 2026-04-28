import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "./env";

export type Theme = "light" | "dark";

export const readTheme = <E extends { Bindings: AppEnv }>(
  c: Context<E>,
): Theme => (getCookie(c, "theme") === "dark" ? "dark" : "light");

export const writeTheme = <E extends { Bindings: AppEnv }>(
  c: Context<E>,
  theme: Theme,
) => {
  setCookie(c, "theme", theme, {
    httpOnly: true,
    sameSite: "Lax",
    secure: c.env?.ENVIRONMENT === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
};
