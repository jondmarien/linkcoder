import { Hono } from "hono";
import { createDb } from "../db/client";
import { linkReports } from "../db/schema";
import { getLinkBySlug } from "../links/repository";
import { checkRateLimit, getClientIp } from "../rate-limit";
import { readTheme } from "../theme";
import type { HonoAppEnv } from "../types";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { fieldClass, inputClass, labelClass } from "../ui/form";
import { page } from "../views/layout";

type ReportBody = {
  slug?: string;
  reason?: string;
  reporter_email?: string;
};

export const reportRoutes = new Hono<HonoAppEnv>();

const parseReportBody = async (request: Request): Promise<ReportBody> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as ReportBody;
  }

  const form = await request.formData();
  return {
    slug: String(form.get("slug") ?? ""),
    reason: String(form.get("reason") ?? ""),
    reporter_email: String(form.get("reporter_email") ?? ""),
  };
};

reportRoutes.get("/report", (c) =>
  c.html(
    page({
      title: "Report a link",
      theme: readTheme(c),
      body: `<main class="flex flex-1 items-center justify-center py-16">
        <section class="${cardClass("w-full max-w-lg")}">
          <div class="space-y-6 px-6">
            <div>
              <p class="font-mono text-sm text-muted-foreground">chron0 links</p>
              <h1 class="mt-2 text-3xl font-semibold tracking-tight">Report a link</h1>
            </div>
            <form class="grid gap-4" method="post" action="/report">
              <div class="${fieldClass()}">
                <label class="${labelClass()}" for="slug">Slug</label>
                <input class="${inputClass()}" id="slug" name="slug" required>
              </div>
              <div class="${fieldClass()}">
                <label class="${labelClass()}" for="reason">Reason</label>
                <input class="${inputClass()}" id="reason" name="reason" required>
              </div>
              <div class="${fieldClass()}">
                <label class="${labelClass()}" for="reporter_email">Email (optional)</label>
                <input class="${inputClass()}" id="reporter_email" name="reporter_email" type="email">
              </div>
              <button class="${buttonClass()}" type="submit">Submit report</button>
            </form>
          </div>
        </section>
      </main>`,
    }),
  ),
);

reportRoutes.post("/report", async (c) => {
  const limit = await checkRateLimit(
    c.env.REPORTS_BY_IP,
    `report:${getClientIp(c.req.raw.headers)}`,
  );

  if (limit) {
    return limit;
  }

  const body = await parseReportBody(c.req.raw);
  const slug = body.slug?.trim();
  const reason = body.reason?.trim();

  if (!slug || !reason) {
    return c.json({ error: "Slug and reason are required." }, 400);
  }

  const db = createDb(c.env.DB);
  const link = await getLinkBySlug(db, slug);

  if (!link) {
    return c.json({ error: "Link not found." }, 404);
  }

  const [report] = await db
    .insert(linkReports)
    .values({
      id: crypto.randomUUID(),
      linkId: link.id,
      reporterEmail: body.reporter_email?.trim() || null,
      reason,
      createdAt: new Date(),
    })
    .returning();

  if (!report) {
    throw new Error("Failed to create report.");
  }

  return c.json({ id: report.id, status: "received" }, 201);
});
