import type { Theme } from "../theme";
import { cardClass } from "../ui/card";
import { page } from "./layout";

const staticPage = ({
  body,
  theme,
  title,
}: {
  body: string;
  theme: Theme;
  title: string;
}) =>
  page({
    title,
    theme,
    body: `<main class="flex flex-1 items-center justify-center py-16">
      <article class="${cardClass("w-full max-w-3xl")}">
        <div class="prose prose-neutral max-w-none space-y-5 px-6 dark:prose-invert">
          ${body}
        </div>
      </article>
    </main>`,
  });

export const termsPage = ({ theme }: { theme: Theme }) =>
  staticPage({
    title: "Terms of Service",
    theme,
    body: `<h1 class="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p class="text-muted-foreground">chron0 links is a free personal link shortener. Do not use it for malware, phishing, spam, harassment, illegal content, or attempts to evade platform protections.</p>
      <p class="text-muted-foreground">Links may be scanned, reported, reviewed, disabled, or deleted to protect visitors and the service.</p>`,
  });

export const privacyPage = ({ theme }: { theme: Theme }) =>
  staticPage({
    title: "Privacy Policy",
    theme,
    body: `<h1 class="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p class="text-muted-foreground">chron0 links stores account details needed for authentication, destination URLs you create, abuse reports, and redirect analytics such as slug, country, referrer host, and user-agent family.</p>
      <p class="text-muted-foreground">Authentication email is handled through Better Auth and Resend. Redirect analytics are written to Cloudflare Analytics Engine.</p>`,
  });

export const helpPage = ({ theme }: { theme: Theme }) =>
  staticPage({
    title: "Help",
    theme,
    body: `<h1 class="text-3xl font-semibold tracking-tight">Help</h1>
      <p class="text-muted-foreground">Create an account, verify your email, then use the dashboard to create and manage short links.</p>
      <p class="text-muted-foreground">If a link looks unsafe, use the public report form at <a class="underline" href="/report">/report</a>.</p>`,
  });

export const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://link.chron0.tech/sitemap.xml
`;

export const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://link.chron0.tech/</loc></url>
  <url><loc>https://link.chron0.tech/help</loc></url>
  <url><loc>https://link.chron0.tech/terms</loc></url>
  <url><loc>https://link.chron0.tech/privacy</loc></url>
</urlset>
`;
