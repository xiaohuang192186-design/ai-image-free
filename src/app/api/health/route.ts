import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/generate";

export const runtime = "nodejs";

/** Lightweight readiness check — no secrets leaked. */
export async function GET() {
  const provider = resolveProvider();
  return NextResponse.json({
    ok: true,
    provider,
    hasHfToken: Boolean(process.env.HF_TOKEN),
    hasDashScopeKey: Boolean(process.env.DASHSCOPE_API_KEY),
    dashscopeModel: process.env.DASHSCOPE_MODEL || "z-image-turbo",
    hasR2: Boolean(
      process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_ENDPOINT &&
        process.env.R2_PUBLIC_URL
    ),
  });
}
