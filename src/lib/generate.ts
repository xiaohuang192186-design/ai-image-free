/**
 * Unified image generation entry.
 *
 * 默认: fal 直连 Z-Image（成人向弱审、便宜）
 * 可选: dashscope 千问 / 万相 / z-image（有平台审核）
 *
 * 请求体可带:
 *   provider: "fal" | "hf" | "dashscope"
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
  /** 单次请求覆盖默认 provider */
  provider?: string;
  /** 百炼模型名，如 qwen-image-2.0 */
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

/** 环境默认（无请求覆盖时） */
export function resolveProvider(): ResolvedProvider {
  const fromEnv = normalizeProvider(process.env.IMAGE_PROVIDER);
  if (fromEnv === "dashscope") {
    if (nsfwModeOn() && process.env.ALLOW_DASHSCOPE === "1") return "dashscope";
    if (nsfwModeOn()) {
      if (hasFalKey()) return "fal";
      return "hf";
    }
    return "dashscope";
  }
  if (fromEnv === "fal") return "fal";
  if (fromEnv === "hf") return "hf";

  if (nsfwModeOn()) {
    if (hasFalKey()) return "fal";
    if (hasHfToken()) return "hf";
    return "fal";
  }

  if (hasFalKey()) return "fal";
  if (hasHfToken()) return "hf";
  if (hasDashScopeKey()) return "dashscope";
  return "fal";
}

/**
 * 解析本次请求用哪个 provider。
 * 用户在 UI 显式选「千问」时，即使 NSFW_MODE=1 也允许 dashscope（用户知情选择合规通道）。
 */
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

  const result = await generateWithHf(prompt, aspectRatio);
  return {
    ...result,
    provider: "hf",
    model: "Tongyi-MAI/Z-Image-Turbo (via HF Router→fal)",
  };
}

export { HFModelLoadingError, HFRateLimitError } from "./hf";
export type { GenerationResult };
