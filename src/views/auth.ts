import type { Theme } from "../theme";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";
import { fieldClass, inputClass, labelClass } from "../ui/form";
import { page } from "./layout";

const authPage = (title: string, theme: Theme, body: string) =>
  page({
    title,
    theme,
    body: `<main class="flex flex-1 items-center justify-center py-16">
        <section class="${cardClass("w-full max-w-md")}">
          <div class="space-y-6 px-6">
            ${body}
          </div>
        </section>
      </main>`,
  });

export const loginPage = ({ theme }: { theme: Theme }) =>
  authPage(
    "Log in",
    theme,
    `<div class="space-y-2">
        <p class="font-mono text-sm text-muted-foreground">chron0 links</p>
        <h1 class="text-3xl font-semibold tracking-tight">Log in</h1>
      </div>
      <form class="grid gap-4" method="post" action="/api/auth/sign-in/magic-link">
        <div class="${fieldClass()}">
          <label class="${labelClass()}" for="email">Email</label>
          <input class="${inputClass()}" id="email" name="email" type="email" autocomplete="email" required>
        </div>
        <input type="hidden" name="callbackURL" value="/dashboard">
        <button class="${buttonClass("default")}" type="submit">Send magic link</button>
      </form>
      <p><a class="${buttonClass("outline")}" href="/api/auth/sign-in/google">Continue with Google</a></p>`,
  );

export const signupPage = ({ theme }: { theme: Theme }) =>
  authPage(
    "Sign up",
    theme,
    `<div class="space-y-2">
        <p class="font-mono text-sm text-muted-foreground">chron0 links</p>
        <h1 class="text-3xl font-semibold tracking-tight">Sign up</h1>
      </div>
      <form class="grid gap-4" method="post" action="/api/auth/sign-in/magic-link">
        <div class="${fieldClass()}">
          <label class="${labelClass()}" for="email">Email</label>
          <input class="${inputClass()}" id="email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="${fieldClass()}">
          <label class="${labelClass()}" for="name">Name</label>
          <input class="${inputClass()}" id="name" name="name" autocomplete="name">
        </div>
        <input type="hidden" name="callbackURL" value="/dashboard">
        <button class="${buttonClass("default")}" type="submit">Create account</button>
      </form>
      <p><a class="${buttonClass("outline")}" href="/api/auth/sign-in/google">Continue with Google</a></p>`,
  );

export const verifyPage = ({ theme }: { theme: Theme }) =>
  authPage(
    "Verify email",
    theme,
    `<div class="space-y-2">
        <p class="font-mono text-sm text-muted-foreground">chron0 links</p>
        <h1 class="text-3xl font-semibold tracking-tight">Check your email</h1>
      </div>
      <p class="text-muted-foreground">Your chron0 links account needs email verification before shortened links redirect publicly.</p>`,
  );
