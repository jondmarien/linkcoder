import type { ReviewQueueItem } from "../admin/review";
import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { page } from "./layout";

export const adminReviewPage = ({
  items,
  theme,
}: {
  items: ReviewQueueItem[];
  theme: Theme;
}) =>
  page({
    title: "Admin review",
    theme,
    body: `<main class="grid flex-1 gap-8 py-10">
      <section>
        <p class="font-mono text-sm text-muted-foreground">Admin</p>
        <h1 class="mt-2 text-4xl font-semibold tracking-tight">Review queue</h1>
        <p class="mt-3 max-w-2xl text-muted-foreground">Suspicious and reported links that need a decision.</p>
      </section>
      <section class="${cardClass("overflow-hidden py-0")}">
        <div class="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-6 py-4 text-sm font-medium text-muted-foreground">
          <span>Link</span>
          <span>Status</span>
          <span>Reports</span>
          <span>Actions</span>
        </div>
        ${
          items.length
            ? items
                .map(
                  (
                    item,
                  ) => `<div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-6 py-4 text-sm">
                    <span class="break-all font-mono">/${item.slug}<br><span class="text-muted-foreground">${item.url}</span></span>
                    <span>${item.scanStatus}</span>
                    <span>${item.reportCount}</span>
                    <span class="flex gap-2">
                      <form method="post" action="/admin/review/${item.slug}/approve"><button class="${buttonClass("secondary", "sm")}" type="submit">Approve</button></form>
                      <form method="post" action="/admin/review/${item.slug}/disable"><button class="${buttonClass("outline", "sm")}" type="submit">Disable</button></form>
                    </span>
                  </div>`,
                )
                .join("")
            : `<div class="px-6 py-8 text-sm text-muted-foreground">No links need review.</div>`
        }
      </section>
    </main>`,
  });
