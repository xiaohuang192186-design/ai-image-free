/**
 * HuggingFace Inference API client for Z-Image-Turbo.
 * Zero-dependency, pure fetch() implementation.
 */

import { DIMENSIONS, AspectRatio } from "./dimensions";

const HF_API_BASE = "https://api-inference.huggingface.co/models";
const MODEL = "Tongyi-MAI/Z-Image-Turbo";
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

// Rate-limit / cold-start error codes we expose to the caller
export class HFModelLoadingError extends Error {
  retryAfter: number;
  constructor(sec: number = 15) {
    super("Model is loading, retry later");
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

export interface GenerationResult {
  imageBytes: Buffer;
  seed: number;
}

/**
 * Generate an image from a text prompt using Z-Image-Turbo.
 * ~5s on warm model, ~20s cold start (HF free tier).
 *
 * Does NOT sleep on the server for cold starts — throws HFModelLoadingError
 * immediately so the caller (API route) can tell the client to retry.
 */
export async function generateImage(
  prompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN not set");

  const size = DIMENSIONS[aspectRatio] || DIMENSIONS["1:1"];

  const body = JSON.stringify({
    inputs: prompt,
    parameters: {
      width: size.width,
      height: size.height,
      num_inference_steps: 8,
      guidance_scale: 0.0,
    },
  });

  const url = `${HF_API_BASE}/${MODEL}`;

  // First attempt (15s timeout — Vercel Hobby has ~10s hard cap;
  // Pro users can raise it. This gives HF ~15s to start responding.)
  let response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  // Cold start: tell caller to retry later (don't sleep here!)
  if (response.status === 503) {
    const err = await response.json().catch(() => ({}));
    if (err.error?.includes("loading") || err.estimated_time) {
      const wait = err.estimated_time ?? 15;
      throw new HFModelLoadingError(Math.ceil(wait));
    }
  }

  // Rate limited
  if (response.status === 429) {
    throw new HFRateLimitError();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HF API error ${response.status}: ${text.slice(0, 200)}`);
  }

  // Validate we actually got an image
  const contentType = response.headers.get("content-type") ?? "";
  const buf = Buffer.from(await response.arrayBuffer());

  if (!contentType.startsWith("image/") && buf.length > 0) {
    // Check PNG magic bytes as fallback
    const isPNG = buf.slice(0, 4).equals(PNG_MAGIC);
    if (!isPNG) {
      const preview = new TextDecoder().decode(buf.subarray(0, 200));
      throw new Error(`HF returned non-image response (${contentType}): ${preview}`);
    }
  }

  // Extract seed (may not be reliable on HF free tier)
  const seedHeader = response.headers.get("x-hf-seed");
  const seed = seedHeader ? parseInt(seedHeader, 10) : Date.now();

  return { imageBytes: buf, seed };
}
