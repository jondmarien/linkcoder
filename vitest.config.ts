import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.jsonc",
      },
      miniflare: {
        bindings: {
          BETTER_AUTH_SECRET: "test-only-better-auth-secret-32-characters",
        },
      },
    }),
  ],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
