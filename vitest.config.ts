import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(rootDir, "src/db/migrations"),
  );

  return {
    plugins: [
      cloudflareTest({
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
        miniflare: {
          bindings: {
            BETTER_AUTH_SECRET: "test-only-better-auth-secret-32-characters",
            CLOUDFLARE_ACCOUNT_ID: "",
            EMAIL_DELIVERY_DISABLED: "true",
            RESEND_API_KEY: "",
            TEST_MIGRATIONS: migrations,
            URL_SCANNER_API_TOKEN: "",
          },
        },
      }),
    ],
    test: {
      include: ["tests/**/*.test.ts"],
      setupFiles: ["./tests/setup/apply-migrations.ts"],
    },
  };
});
