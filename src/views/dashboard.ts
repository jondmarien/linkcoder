import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { inputClass, labelClass } from "../ui/form";
import { page } from "./layout";

export const dashboardPage = ({ theme }: { theme: Theme }) =>
  page({
    title: "Dashboard",
    theme,
    body: `<main class="grid flex-1 gap-8 py-10">
      <section class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="font-mono text-sm text-muted-foreground">Dashboard</p>
          <h1 class="mt-2 text-4xl font-semibold tracking-tight">Your links</h1>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            Create, review, and measure your shortened links from one server-rendered workspace.
          </p>
        </div>
        <a class="${buttonClass("default", "lg")}" href="/links/new">Create a short link</a>
      </section>
      <section class="${cardClass()}">
        <div class="grid gap-4 px-6 md:grid-cols-[1fr_auto] md:items-end">
          <div class="grid gap-2">
            <label class="${labelClass()}" for="url">Destination URL</label>
            <input class="${inputClass()}" id="url" placeholder="https://example.com/a-long-url">
          </div>
          <button class="${buttonClass("secondary")}" type="button">Prepare link</button>
        </div>
      </section>
      <section class="${cardClass("overflow-hidden py-0")}">
        <div class="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-6 py-4 text-sm font-medium text-muted-foreground">
          <span>Short link</span>
          <span>Status</span>
          <span>Clicks</span>
        </div>
        <div class="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-5 text-sm">
          <span class="font-mono">No links yet</span>
          <span class="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">Ready</span>
          <span>0</span>
        </div>
      </section>
    </main>`,
  });
