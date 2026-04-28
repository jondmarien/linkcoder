import type { Context } from "hono";
import type { AppVariables } from "./auth/middleware";
import type { AppEnv } from "./env";

export type HonoAppEnv = {
  Bindings: AppEnv;
  Variables: AppVariables;
};

export type AppContext = Context<HonoAppEnv>;
