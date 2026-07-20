/**
 * Unified image generation entry.
 *
 * IMAGE_PROVIDER:
 *   - fal       : fal.ai 直连 https://fal.run/fal-ai/z-image/turbo （推荐，需 FAL_KEY）
 *   - hf        : HuggingFace Router 中转 fal（需 HF_TOKEN）
 *   - dashscope : 阿里云百炼（有审核，成人向勿用）
 *   - auto      : FAL_KEY → fal；否则 HF_TOKEN → hf
 *
 * NSFW_MODE=1 : 禁止 dashscope；优先 fal，其次 hf
 */

import { AspectRatio } from "./dimensions";
import { generateWithDashScope } from "./dashscope";
import { generateWithFal } from "./fal";
import { generateImage as generateWithHf } from "./hf";
import type { GenerationResult } from "./types";

export type ImageProvider = "auto" | "dashscope" | "hf" | "fal";
export type ResolvedProvider = "fal" | "hf" | "dashscope";

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

export function resolveProvider(): ResolvedProvider {
  const raw = (process.env.IMAGE_PROVIDER || "auto").toLowerCase().trim();

  // 显式指定
  if (raw === "fal") return "fal";
  if (raw === "hf" || raw === "huggingface") return "hf";
  if (raw === "dashscope" || raw === "bailian" || raw === "aliyun") {
    if (nsfwModeOn()) {
      // 成人向模式禁止百炼
      if (hasFalKey()) return "fal";
      return "hf";
    }
    return "dashscope";
  }

  // NSFW：优先 fal 直连，再 HF 中转，绝不百炼
  if (nsfwModeOn()) {
    if (hasFalKey()) return "fal";
    if (hasHfToken()) return "hf";
    return "fal";
  }

  // auto
  if (hasFalKey()) return "fal";
  if (hasHfToken()) return "hf";
  if (
    process.env.PREFER_DASHSCOPE === "1" &&
    process.env.DASHSCOPE_API_KEY?.trim()
  ) {
    return "dashscope";
  }
  return "fal";
}

export async function generateImage(
  prompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const provider = resolveProvider();

  if (provider === "dashscope") {
    return generateWithDashScope(prompt, aspectRatio);
  }

  if (provider === "fal") {
    return generateWithFal(prompt, aspectRatio);
  }

  // hf 中转（可作 fal 直连失败时的手动切换，不是自动 fallback，保持可预测）
  const result = await generateWithHf(prompt, aspectRatio);
  return {
    ...result,
    provider: "hf",
    model: "Tongyi-MAI/Z-Image-Turbo (via HF Router→fal)",
  };
}

export { HFModelLoadingError, HFRateLimitError } from "./hf";
export type { GenerationResult };
