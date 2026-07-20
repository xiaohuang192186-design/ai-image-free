/**
 * fal.ai 直连客户端 — Z-Image-Turbo
 *
 * 文档: https://fal.ai/models/fal-ai/z-image/turbo/api
 * 端点: POST https://fal.run/fal-ai/z-image/turbo
 * 鉴权: Authorization: Key $FAL_KEY
 *
 * 不经过 HuggingFace Router。
 */

import { DIMENSIONS, AspectRatio } from "./dimensions";
import type { GenerationResult } from "./types";

const DEFAULT_FAL_URL = "https://fal.run/fal-ai/z-image/turbo";
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

interface FalResponse {
  images?: Array<{ url?: string; content_type?: string }>;
  seed?: number;
  detail?: string | Array<{ msg?: string }>;
  error?: string;
  message?: string;
}

function getFalKey(): string {
  const key =
    process.env.FAL_KEY?.trim() ||
    process.env.FAL_API_KEY?.trim() ||
    "";
  if (!key) throw new Error("FAL_KEY not set");
  return key;
}

/**
 * 直连 fal.run 生成图片。
 */
export async function generateWithFal(
  prompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const apiKey = getFalKey();
  const size = DIMENSIONS[aspectRatio] || DIMENSIONS["1:1"];
  const url = process.env.FAL_MODEL_URL?.replace(/\/+$/, "") || DEFAULT_FAL_URL;

  const safetyOn = ["1", "true", "yes"].includes(
    (process.env.FAL_SAFETY_CHECKER || process.env.HF_SAFETY_CHECKER || "").toLowerCase()
  );
  const steps = Math.min(
    20,
    Math.max(4, parseInt(process.env.FAL_INFERENCE_STEPS || process.env.HF_INFERENCE_STEPS || "8", 10) || 8)
  );

  const body = JSON.stringify({
    prompt,
    image_size: {
      width: size.width,
      height: size.height,
    },
    num_inference_steps: steps,
    enable_safety_checker: safetyOn,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(55_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fal network error: ${msg}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const raw = Buffer.from(await response.arrayBuffer());

  if (contentType.startsWith("image/") || raw.subarray(0, 4).equals(PNG_MAGIC)) {
    return {
      imageBytes: raw,
      seed: Date.now(),
      provider: "fal",
      model: "fal-ai/z-image/turbo",
    };
  }

  let parsed: FalResponse;
  try {
    parsed = JSON.parse(raw.toString("utf8")) as FalResponse;
  } catch {
    throw new Error(
      `fal non-JSON ${response.status}: ${raw.toString("utf8").slice(0, 200)}`
    );
  }

  if (!response.ok) {
    const detail =
      typeof parsed.detail === "string"
        ? parsed.detail
        : Array.isArray(parsed.detail)
          ? parsed.detail.map((d) => d.msg).filter(Boolean).join("; ")
          : parsed.error || parsed.message || raw.toString("utf8").slice(0, 200);
    throw new Error(`fal HTTP ${response.status}: ${detail}`);
  }

  const imageUrl = parsed.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error(
      `fal returned no image URL: ${JSON.stringify(parsed).slice(0, 240)}`
    );
  }

  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fal image download failed: ${msg}`);
  }

  if (!imgRes.ok) {
    throw new Error(`fal image download HTTP ${imgRes.status}`);
  }

  const imageBytes = Buffer.from(await imgRes.arrayBuffer());
  if (imageBytes.length < 100) {
    throw new Error("fal downloaded image is empty/too small");
  }

  const seed =
    typeof parsed.seed === "number" && Number.isFinite(parsed.seed)
      ? parsed.seed
      : Date.now();

  return {
    imageBytes,
    seed,
    provider: "fal",
    model: "fal-ai/z-image/turbo",
  };
}
