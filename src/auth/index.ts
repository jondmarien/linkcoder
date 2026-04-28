import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import { createDb } from "../db/client";
import { authSchema } from "../db/schema";
import type { AppEnv } from "../env";
import { sendMagicLinkEmail } from "./email";

const getAuthSecret = (env: AppEnv) => {
  if (env.BETTER_AUTH_SECRET) {
    return env.BETTER_AUTH_SECRET;
  }

  if (env.ENVIRONMENT === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  }

  return "development-only-better-auth-secret";
};

export const createAuth = (env: AppEnv, baseURL: string = env.APP_ORIGIN) => {
  const db = createDb(env.DB);

  return betterAuth({
    appName: "chron0 links",
    baseURL,
    secret: getAuthSecret(env),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    trustedOrigins: [env.APP_ORIGIN],
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
    plugins: [
      magicLink({
        sendMagicLink: ({ email, url }) =>
          sendMagicLinkEmail(env, { email, url }),
      }),
    ],
    user: {
      modelName: "users",
    },
    session: {
      modelName: "sessions",
    },
    account: {
      modelName: "accounts",
    },
    verification: {
      modelName: "verifications",
    },
  });
};
