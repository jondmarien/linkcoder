import { Hono } from "hono";
import type { AppEnv } from "../env";
import { createAuth } from ".";

export const authRoutes = new Hono<{ Bindings: AppEnv }>();

authRoutes.on(["GET", "POST"], "/api/auth/*", (c) =>
  createAuth(c.env).handler(c.req.raw),
);
