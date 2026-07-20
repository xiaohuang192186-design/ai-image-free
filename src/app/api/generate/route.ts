/**
 * POST /api/generate
 * prompt → (可选 Turnstile) → 限流 → 生图 → R2 → imageUrl
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  resolveProvider,
  HFModelLoadingError,
  HFRateLimitError,
} from "@/lib/generate";
import { uploadToR2, generateFilename } from "@/lib/r2";
import { VALID_RATIOS, AspectRatio } from "@/lib/dimensions";
import { consumeRateLimit, getClientIP } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;

  // ---- Turnstile（配置了 SECRET 才强制）----
  const turnstileToken =
    typeof record.turnstile_token === "string"
      ? record.turnstile_token
      : typeof record.turnstileToken === "string"
        ? record.turnstileToken
        : undefined;

  const tv = await verifyTurnstile(turnstileToken, ip);
  if (!tv.ok) {
    return NextResponse.json(
      { error: tv.message || "Human verification failed." },
      { status: 400 }
    );
  }

  // ---- 限流 ----
  const rl = consumeRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: rl.message,
        reason: rl.reason,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  // ---- 参数 ----
  if (!record || typeof record.prompt !== "string") {
    return NextResponse.json({ error: "Missing 'prompt' field" }, { status: 400 });
  }

  const prompt = record.prompt.trim().slice(0, 1000);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
  }

  const rawRatio =
    (typeof record.aspect_ratio === "string" && record.aspect_ratio) ||
    (typeof record.aspectRatio === "string" && record.aspectRatio) ||
    "1:1";

  if (!VALID_RATIOS.includes(rawRatio as AspectRatio)) {
    return NextResponse.json(
      {
        error: `Invalid aspect_ratio. Must be one of: ${VALID_RATIOS.join(", ")}`,
      },
      { status: 400 }
    );
  }
  const aspectRatio = rawRatio as AspectRatio;

  try {
    const { imageBytes, seed, provider, model } = await generateImage(
      prompt,
      aspectRatio
    );

    const filename = generateFilename(seed);
    const imageUrl = await uploadToR2(imageBytes, filename, "image/png");

    return NextResponse.json({
      imageUrl,
      seed,
      provider: provider ?? resolveProvider(),
      model,
      quota: rl.remaining,
    });
  } catch (err) {
    if (err instanceof HFModelLoadingError) {
      return NextResponse.json(
        {
          error: "Model is warming up. Please retry. / 模型预热中，请重试。",
          retryAfter: err.retryAfter,
        },
        { status: 503, headers: { "Retry-After": String(err.retryAfter) } }
      );
    }

    if (err instanceof HFRateLimitError) {
      return NextResponse.json(
        {
          error:
            "Service is busy. Please try again later. / 服务繁忙，请稍后再试。",
        },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[generate] FAILED (${err instanceof Error ? err.name : "unknown"}): ${message}`
    );

    return NextResponse.json(
      { error: "Generation failed. Please try again. / 生成失败，请重试。" },
      { status: 500 }
    );
  }
}
