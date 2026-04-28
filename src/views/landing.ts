import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { page } from "./layout";

type LandingUser = {
  email?: string | null;
  name?: string | null;
};

export const landingPage = ({
  appOrigin = "https://link.chron0.tech",
  theme,
  user,
}: {
  appOrigin?: string;
  theme: Theme;
  user?: LandingUser | null;
}) => {
  const primaryHref = user ? "/links/new" : "/signup";
  const secondaryHref = user ? "/dashboard" : "/login";
  const secondaryLabel = user ? "Dashboard" : "Log in";

  return page({
    title: "Short links",
    meta: {
      description:
        "Short links that keep redirects fast at the edge while tracking ownership, review, and click history.",
      image: new URL("/og-image.svg", appOrigin).toString(),
      imageAlt:
        "chron0 links preview card with a short link and edge analytics.",
      title: "Short links with a longer memory.",
      url: new URL("/", appOrigin).toString(),
    },
    theme,
    user,
    body: `<main class="grid flex-1 items-center gap-12 py-16 md:grid-cols-[1.15fr_0.85fr]">
      <section class="space-y-8">
        <div class="inline-flex rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Built for fast redirects, strict review, and useful analytics.
        </div>
        <div class="space-y-5">
          <h1 class="max-w-3xl text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Short links with a longer memory.
          </h1>
          <p class="max-w-2xl text-lg leading-8 text-muted-foreground">
            link.chron0.tech keeps redirects small at the edge while D1, KV, and Analytics Engine keep ownership, safety, and click history close by.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a class="${buttonClass("default", "lg")}" href="${primaryHref}">Start shortening</a>
          <a class="${buttonClass("outline", "lg")}" href="${secondaryHref}">${secondaryLabel}</a>
        </div>
      </section>
      <section class="${cardClass("relative overflow-hidden")}">
        <div class="absolute inset-x-0 top-0 h-1 bg-primary"></div>
        <div class="space-y-6 px-6">
          <div>
            <p class="text-sm text-muted-foreground">Preview</p>
            <p class="mt-2 rounded-lg border bg-background p-4 font-mono text-sm">link.chron0.tech/atlas7</p>
          </div>
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div class="rounded-lg bg-secondary p-3">
              <p class="font-semibold">KV</p>
              <p class="text-muted-foreground">hot cache</p>
            </div>
            <div class="rounded-lg bg-secondary p-3">
              <p class="font-semibold">D1</p>
              <p class="text-muted-foreground">source</p>
            </div>
            <div class="rounded-lg bg-secondary p-3">
              <p class="font-semibold">AE</p>
              <p class="text-muted-foreground">clicks</p>
            </div>
          </div>
        </div>
      </section>
    </main>`,
  });
};
