import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Lightweight readiness check — no secrets, no outbound probes. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    hasHfToken: Boolean(process.env.HF_TOKEN),
    hasR2: Boolean(
      process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_ENDPOINT &&
        process.env.R2_PUBLIC_URL
    ),
  });
}
