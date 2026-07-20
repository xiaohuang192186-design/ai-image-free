/**
 * POST /api/generate
 * Generate an AI image from a text prompt.
 *
 * Flow: prompt → HuggingFace Z-Image-Turbo → R2 upload → public URL
 * Total latency ~5-8s (warm) or 503→retry (cold start).
 *
 * Rate limited at 10 req/min per IP (in-memory, per-instance).
 */

import { NextRequest, NextResponse } from "next/server";
import { generateImage, HFModelLoadingError, HFRateLimitError } from "@/lib/hf";
import { uploadToR2, generateFilename } from "@/lib/r2";
import { VALID_RATIOS, AspectRatio } from "@/lib/dimensions";

// Vercel Pro extends this to 60s; free tier has ~10s hard cap
export const maxDuration = 30;

// ---- In-memory rate limiter (per instance, resets on cold start) ----
const rateWindow = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;    // requests
const RATE_WINDOW = 60;   // seconds
const RATE_CLEANUP_MS = 5 * 60 * 1000;

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateWindow.get(ip);

  // Periodic cleanup of stale entries
  if (rateWindow.size > 1000) {
    for (const [key, val] of rateWindow) {
      if (now - val.resetAt > RATE_CLEANUP_MS) rateWindow.delete(key);
    }
  }

  if (!entry || now > entry.resetAt) {
    rateWindow.set(ip, { count: 1, resetAt: now + RATE_WINDOW * 1000 });
    return true;
  }

  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// ---- Route handler ----

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(RATE_WINDOW) } }
    );
  }

  // Parse and validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof (body as Record<string, unknown>).prompt !== "string") {
    return NextResponse.json({ error: "Missing 'prompt' field" }, { status: 400 });
  }

  const prompt = ((body as Record<string, string>).prompt ?? "").trim().slice(0, 1000);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
  }

  const rawRatio = (body as Record<string, string>).aspect_ratio ?? "1:1";
  if (!VALID_RATIOS.includes(rawRatio as AspectRatio)) {
    return NextResponse.json({
      error: `Invalid aspect_ratio. Must be one of: ${VALID_RATIOS.join(", ")}`,
    }, { status: 400 });
  }
  const aspectRatio = rawRatio as AspectRatio;

  try {
    // Step 1: Generate image via HuggingFace
    const { imageBytes, seed } = await generateImage(prompt, aspectRatio);

    // Step 2: Upload to R2
    const filename = generateFilename(seed);
    const imageUrl = await uploadToR2(imageBytes, filename, "image/png");

    return NextResponse.json({ imageUrl, seed });

  } catch (err) {
    // Cold start → tell client to retry
    if (err instanceof HFModelLoadingError) {
      return NextResponse.json(
        { error: "Model is warming up. Please retry.", retryAfter: err.retryAfter },
        { status: 503, headers: { "Retry-After": String(err.retryAfter) } }
      );
    }

    // Rate limited by HF
    if (err instanceof HFRateLimitError) {
      return NextResponse.json(
        { error: "Service is busy. Please try again in a moment." },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }

    // Unknown error — log details, return generic message
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[generate] FAILED (${err instanceof Error ? err.name : "unknown"}): ${message}`);

    // Don't leak internal errors to clients
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
