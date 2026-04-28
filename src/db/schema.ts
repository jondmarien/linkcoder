import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name"),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    url: text("url").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    expiresAt: timestamp("expires_at"),
    disabledAt: timestamp("disabled_at"),
    disabledReason: text("disabled_reason"),
    scanStatus: text("scan_status", {
      enum: ["pending", "clean", "suspicious", "malicious"],
    })
      .notNull()
      .default("pending"),
    scanVerdictJson: text("scan_verdict_json"),
    lastScannedAt: timestamp("last_scanned_at"),
  },
  (table) => [
    index("links_user_id_idx").on(table.userId),
    index("links_scan_status_idx").on(table.scanStatus),
  ],
);

export const linkReports = sqliteTable(
  "link_reports",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    reporterEmail: text("reporter_email"),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("link_reports_link_id_idx").on(table.linkId),
    index("link_reports_resolved_at_idx").on(table.resolvedAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  links: many(links),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  reports: many(linkReports),
}));

export const linkReportsRelations = relations(linkReports, ({ one }) => ({
  link: one(links, {
    fields: [linkReports.linkId],
    references: [links.id],
  }),
}));

export const schema = {
  accounts,
  linkReports,
  links,
  sessions,
  users,
  verifications,
};

export const authSchema = {
  ...schema,
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
};
