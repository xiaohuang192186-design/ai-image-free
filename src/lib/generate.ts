/**
 * Unified image generation entry.
 *
 * 实测（2026-07-21）:
 *   HF Router → fal : 成人向提示词可通过
 *   fal.run 直连    : 同提示词常 422 content checker
 *
 * 因此默认优先 HF 透传；fal 作余额备用；百炼有强审。
 *
 * 请求体可带:
 *   provider: "hf" | "fal" | "dashscope"
 *   model:    "qwen-image-2.0" | "wan2.7-image-pro" | ...
 */

import { AspectRatio } from "./dimensions";
import { generateWithDashScope } from "./dashscope";
import { generateWithFal } from "./fal";
import { generateImage as generateWithHf } from "./hf";
import type { GenerationResult } from "./types";

export type ImageProvider = "auto" | "dashscope" | "hf" | "fal";
export type ResolvedProvider = "fal" | "hf" | "dashscope";

export interface GenerateOptions {
  provider?: string;
  model?: string;
}

function nsfwModeOn(): boolean {
  const v = (process.env.NSFW_MODE || "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function hasFalKey(): boolean {
  return Boolean(process.env.FAL_KEY?.trim() || process.env.FAL_API_KEY?.trim());
}

function hasHfToken(): boolean {
  return Boolean(process.env.HF_TOKEN?.trim());
}

function hasDashScopeKey(): boolean {
  return Boolean(process.env.DASHSCOPE_API_KEY?.trim());
}

function normalizeProvider(raw?: string): ResolvedProvider | null {
  if (!raw) return null;
  const p = raw.toLowerCase().trim();
  if (p === "fal") return "fal";
  if (p === "hf" || p === "huggingface") return "hf";
  if (p === "dashscope" || p === "bailian" || p === "aliyun" || p === "qwen") {
    return "dashscope";
  }
  return null;
}

/** 环境默认：HF 优先（成人向更松），其次 fal */
export function resolveProvider(): ResolvedProvider {
  const fromEnv = normalizeProvider(process.env.IMAGE_PROVIDER);

  if (fromEnv === "dashscope") {
    // 显式 dashscope；NSFW 默认仍挡，除非 ALLOW_DASHSCOPE=1
    if (nsfwModeOn() && process.env.ALLOW_DASHSCOPE !== "1") {
      if (hasHfToken()) return "hf";
      if (hasFalKey()) return "fal";
    }
    return "dashscope";
  }
  if (fromEnv === "hf") return "hf";
  if (fromEnv === "fal") return "fal";

  // auto / NSFW：HF → fal → dashscope(仅非 NSFW)
  if (hasHfToken()) return "hf";
  if (hasFalKey()) return "fal";
  if (!nsfwModeOn() && hasDashScopeKey()) return "dashscope";
  return "hf";
}

/** 请求覆盖（UI 选模型时） */
export function resolveProviderForRequest(override?: string): ResolvedProvider {
  const o = normalizeProvider(override);
  if (o) return o;
  return resolveProvider();
}

export async function generateImage(
  prompt: string,
  aspectRatio: AspectRatio = "1:1",
  options: GenerateOptions = {}
): Promise<GenerationResult> {
  const provider = resolveProviderForRequest(options.provider);

  if (provider === "dashscope") {
    if (!hasDashScopeKey()) {
      throw new Error(
        "DASHSCOPE_API_KEY not set. 请在 .env.local / Vercel 配置百炼 API Key。"
      );
    }
    return generateWithDashScope(prompt, aspectRatio, options.model);
  }

  if (provider === "fal") {
    return generateWithFal(prompt, aspectRatio);
  }

  // HF 透传（默认 / 成人向主路）
  try {
    const result = await generateWithHf(prompt, aspectRatio);
    return {
      ...result,
      provider: "hf",
      model: "Tongyi-MAI/Z-Image-Turbo (via HF Router→fal)",
    };
  } catch (err) {
    // HF 额度用尽时自动降级 fal（普通图仍可用；成人向可能 422）
    const msg = err instanceof Error ? err.message : String(err);
    const creditOut =
      msg.includes("402") ||
      msg.includes("depleted") ||
      msg.includes("credits") ||
      msg.includes("Purchase pre-paid");
    if (creditOut && hasFalKey()) {
      console.warn(`[generate] HF failed (${msg.slice(0, 120)}), fallback fal`);
      const fb = await generateWithFal(prompt, aspectRatio);
      return {
        ...fb,
        provider: "fal",
        model: "fal-ai/z-image/turbo (fallback after HF credit error)",
      };
    }
    throw err;
  }
}

export { HFModelLoadingError, HFRateLimitError } from "./hf";
export type { GenerationResult };
