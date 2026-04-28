import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { users } from "../db/schema";
import type { AppEnv } from "../env";

export const parseAdminEmails = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (
  email: string | null | undefined,
  value?: string,
) => Boolean(email && parseAdminEmails(value).includes(email.toLowerCase()));

export const promoteAdminIfConfigured = async ({
  db,
  env,
  user,
}: {
  db: Db;
  env: AppEnv;
  user: { id: string; email?: string | null } | null | undefined;
}) => {
  if (!user || !isAdminEmail(user.email, env.ADMIN_EMAILS)) {
    return;
  }

  await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
};

export const getUserRole = async (db: Db, userId: string) => {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  return user?.role ?? "user";
};
