import { applyD1Migrations, type D1Migration } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll } from "vitest";

beforeAll(async () => {
  await applyD1Migrations(
    env.DB,
    (env as typeof env & { TEST_MIGRATIONS: D1Migration[] }).TEST_MIGRATIONS,
  );
});
