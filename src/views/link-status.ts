import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { page } from "./layout";

export const linkStatusPage = ({
  title,
  message,
  theme,
}: {
  title: string;
  message: string;
  theme: Theme;
}) =>
  page({
    title,
    theme,
    body: `<main class="flex flex-1 items-center justify-center py-16">
      <section class="${cardClass("w-full max-w-lg")}">
        <div class="space-y-5 px-6">
          <p class="font-mono text-sm text-muted-foreground">chron0 links</p>
          <h1 class="text-3xl font-semibold tracking-tight">${title}</h1>
          <p class="text-muted-foreground">${message}</p>
          <a class="${buttonClass("outline")}" href="/">Back home</a>
        </div>
      </section>
    </main>`,
  });
