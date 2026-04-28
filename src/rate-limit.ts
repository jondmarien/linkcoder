type RateLimitResult = {
  success: boolean;
};

type RateLimitBinding = {
  limit: (options: { key: string }) => Promise<RateLimitResult>;
};

export const getClientIp = (headers: Headers) =>
  headers.get("cf-connecting-ip") ??
  headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

export const checkRateLimit = async (
  binding: RateLimitBinding,
  key: string,
) => {
  const { success } = await binding.limit({ key });

  if (success) {
    return null;
  }

  return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
};
