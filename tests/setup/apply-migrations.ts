import { applyD1Migrations, type D1Migration } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll } from "vitest";

beforeAll(async () => {
  try {
    await applyD1Migrations(
      env.DB,
      (env as typeof env & { TEST_MIGRATIONS: D1Migration[] }).TEST_MIGRATIONS,
    );
  } catch (error) {
    if (String(error).includes("duplicate column name: click_count")) {
      return;
    }

    throw error;
  }
});
