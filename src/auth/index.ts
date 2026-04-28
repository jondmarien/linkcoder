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

export const createAuth = (env: AppEnv) => {
  const db = createDb(env.DB);

  return betterAuth({
    appName: "chron0 links",
    baseURL: env.APP_ORIGIN,
    secret: getAuthSecret(env),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
      usePlural: true,
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
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    session: {
      modelName: "sessions",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
      },
    },
    account: {
      modelName: "accounts",
      fields: {
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "verifications",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
  });
};
