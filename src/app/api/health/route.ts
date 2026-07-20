import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/generate";
import { isTurnstileRequired } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function GET() {
  const nsfw =
    ["1", "true", "yes", "on"].includes(
      (process.env.NSFW_MODE || "").toLowerCase()
    );
  return NextResponse.json({
    ok: true,
    provider: resolveProvider(),
    nsfwMode: nsfw,
    contentNote: nsfw
      ? "default HF Router→fal (looser NSFW tested); fal direct stricter; Bailian moderated"
      : "provider per IMAGE_PROVIDER (default prefers HF)",
    hasFalKey: Boolean(
      process.env.FAL_KEY?.trim() || process.env.FAL_API_KEY?.trim()
    ),
    hasHfToken: Boolean(process.env.HF_TOKEN),
    hasDashScopeKey: Boolean(process.env.DASHSCOPE_API_KEY),
    falEndpoint:
      process.env.FAL_MODEL_URL || "https://fal.run/fal-ai/z-image/turbo",
    dashscopeModel: process.env.DASHSCOPE_MODEL || "qwen-image-2.0",
    dashscopeReady: Boolean(process.env.DASHSCOPE_API_KEY?.trim()),
    turnstileRequired: isTurnstileRequired(),
    hasTurnstileSiteKey: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    rateLimit: {
      perMin: process.env.RATE_LIMIT_PER_MIN || "10",
      perIpDay: process.env.RATE_LIMIT_PER_IP_DAY || "30",
      globalDay: process.env.RATE_LIMIT_GLOBAL_DAY || "500",
    },
    hasR2: Boolean(
      process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_ENDPOINT &&
        process.env.R2_PUBLIC_URL
    ),
    routes: { en: "/", zh: "/zh", generate: "/api/generate" },
  });
}
