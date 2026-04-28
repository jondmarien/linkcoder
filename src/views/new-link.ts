import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { fieldClass, inputClass, labelClass } from "../ui/form";
import { page } from "./layout";

type NewLinkUser = {
  email?: string | null;
  name?: string | null;
};

export const newLinkPage = ({
  theme,
  user,
}: {
  theme: Theme;
  user?: NewLinkUser | null;
}) =>
  page({
    title: "Create a short link",
    theme,
    user,
    body: `<main class="flex flex-1 items-center justify-center py-16">
      <section class="${cardClass("w-full max-w-xl")}">
        <div class="space-y-6 px-6">
          <div>
            <p class="font-mono text-sm text-muted-foreground">chron0 links</p>
            <h1 class="mt-2 text-3xl font-semibold tracking-tight">Create a short link</h1>
            <p class="mt-3 text-muted-foreground">Paste a destination URL and optionally reserve a custom slug.</p>
          </div>
          <form class="grid gap-4" method="post" action="/api/links">
            <div class="${fieldClass()}">
              <label class="${labelClass()}" for="url">Destination URL</label>
              <input class="${inputClass()}" id="url" name="url" type="url" placeholder="https://example.com/a-long-url" required>
            </div>
            <div class="${fieldClass()}">
              <label class="${labelClass()}" for="slug">Custom slug</label>
              <input class="${inputClass()}" id="slug" name="slug" placeholder="atlas7">
            </div>
            <div class="${fieldClass()}">
              <label class="${labelClass()}" for="expires_at">Expiration</label>
              <input class="${inputClass()}" id="expires_at" name="expires_at" type="datetime-local">
            </div>
            <button class="${buttonClass("default")}" type="submit">Create link</button>
          </form>
        </div>
      </section>
    </main>`,
  });
