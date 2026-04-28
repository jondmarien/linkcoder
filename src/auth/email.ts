import type { AppEnv } from "../env";

type MagicLinkEmail = {
  email: string;
  url: string;
};

export const sendMagicLinkEmail = async (
  env: AppEnv,
  { email, url }: MagicLinkEmail,
) => {
  if (env.EMAIL_DELIVERY_DISABLED === "true") {
    return;
  }

  if (!env.RESEND_API_KEY) {
    if (env.ENVIRONMENT === "production") {
      throw new Error("RESEND_API_KEY is required to send magic links.");
    }

    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL ?? "chron0 links <noreply@link.chron0.tech>",
    to: email,
    subject: "Your chron0 link sign-in link",
    html: `<p>Use this link to sign in to chron0 links:</p><p><a href="${url}">${url}</a></p>`,
    text: `Use this link to sign in to chron0 links: ${url}`,
  });
};
