/**
 * HuggingFace Inference Providers client for Z-Image-Turbo.
 * Uses fal-ai via HF router (model is NOT on free hf-inference).
 *
 * Endpoint (verified):
 *   POST https://router.huggingface.co/fal-ai/fal-ai/z-image/turbo
 * Response:
 *   { images: [{ url }], seed, timings }
 */

import { DIMENSIONS, AspectRatio } from "./dimensions";
import type { GenerationResult } from "./types";

export type { GenerationResult };

const FAL_ZIMAGE_URL =
  "https://router.huggingface.co/fal-ai/fal-ai/z-image/turbo";
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

export class HFModelLoadingError extends Error {
  retryAfter: number;
  constructor(sec: number = 15) {
    super("Model is warming up, retry later");
    this.name = "HFModelLoadingError";
    this.retryAfter = sec;
  }
}

export class HFRateLimitError extends Error {
  constructor() {
    super("Rate limited by HuggingFace");
    this.name = "HFRateLimitError";
  }
}

interface FalImageResponse {
  images?: Array<{ url?: string; content_type?: string }>;
  seed?: number;
  error?: string;
  detail?: string;
}

/**
 * Generate an image from a text prompt using Z-Image-Turbo (fal-ai provider).
 * Typical latency ~1–5s on warm path.
 */
export async function generateImage(
  prompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN not set");

  const size = DIMENSIONS[aspectRatio] || DIMENSIONS["1:1"];
  const url = process.env.HF_FAL_URL || FAL_ZIMAGE_URL;

  const body = JSON.stringify({
    prompt,
    image_size: {
      width: size.width,
      height: size.height,
    },
    num_inference_steps: 8,
    enable_safety_checker: false,
  });

  let response: Response;
  try {
    // Hobby ~10s; fal warm path is usually under 2s
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(25_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`HF/fal network error: ${msg}`);
  }

  if (response.status === 503) {
    throw new HFModelLoadingError(15);
  }
  if (response.status === 429) {
    throw new HFRateLimitError();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const raw = Buffer.from(await response.arrayBuffer());

  // Some providers return raw image bytes
  if (contentType.startsWith("image/") || raw.subarray(0, 4).equals(PNG_MAGIC)) {
    return { imageBytes: raw, seed: Date.now() };
  }

  // fal-ai via HF router returns JSON with image URL
  let parsed: FalImageResponse;
  try {
    parsed = JSON.parse(raw.toString("utf8")) as FalImageResponse;
  } catch {
    throw new Error(
      `HF API error ${response.status}: ${raw.toString("utf8").slice(0, 200)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `HF API error ${response.status}: ${
        parsed.error || parsed.detail || JSON.stringify(parsed).slice(0, 200)
      }`
    );
  }

  const imageUrl = parsed.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error(
      `HF returned no image URL: ${JSON.stringify(parsed).slice(0, 200)}`
    );
  }

  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to download generated image: ${msg}`);
  }

  if (!imgRes.ok) {
    throw new Error(`Image download failed HTTP ${imgRes.status}`);
  }

  const imageBytes = Buffer.from(await imgRes.arrayBuffer());
  if (imageBytes.length < 100) {
    throw new Error("Downloaded image is empty/too small");
  }

  const seed =
    typeof parsed.seed === "number" && Number.isFinite(parsed.seed)
      ? parsed.seed
      : Date.now();

  return { imageBytes, seed };
}
