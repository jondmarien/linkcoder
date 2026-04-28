const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} - chron0 links</title>
  </head>
  <body>
    <main>
      <p>chron0 links</p>
      ${body}
    </main>
  </body>
</html>`;

export const loginPage = () =>
  page(
    "Log in",
    `<h1>Log in</h1>
      <form method="post" action="/api/auth/sign-in/magic-link">
        <label>Email <input name="email" type="email" autocomplete="email" required></label>
        <input type="hidden" name="callbackURL" value="/dashboard">
        <button type="submit">Send magic link</button>
      </form>
      <p><a href="/api/auth/sign-in/google">Continue with Google</a></p>`,
  );

export const signupPage = () =>
  page(
    "Sign up",
    `<h1>Sign up</h1>
      <form method="post" action="/api/auth/sign-in/magic-link">
        <label>Email <input name="email" type="email" autocomplete="email" required></label>
        <label>Name <input name="name" autocomplete="name"></label>
        <input type="hidden" name="callbackURL" value="/dashboard">
        <button type="submit">Create account</button>
      </form>
      <p><a href="/api/auth/sign-in/google">Continue with Google</a></p>`,
  );

export const verifyPage = () =>
  page(
    "Verify email",
    `<h1>Check your email</h1>
      <p>Your chron0 links account needs email verification before shortened links redirect publicly.</p>`,
  );
