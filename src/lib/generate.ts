/**
 * Unified image generation entry.
 *
 * IMAGE_PROVIDER:
 *   - hf        : HuggingFace Router + fal-ai Z-Image-Turbo（默认，平台审核弱，适合成人向合法内容）
 *   - dashscope : 阿里云百炼（有内容安全审核，成人向会被拦）
 *   - auto      : 默认 hf；仅当 IMAGE_PROVIDER=dashscope 或显式 prefer 时用百炼
 *
 * NSFW_MODE=1 时强制走 hf，忽略 dashscope（防止误切到有审通道）
 */

import { AspectRatio } from "./dimensions";
import { generateWithDashScope } from "./dashscope";
import { generateImage as generateWithHf } from "./hf";
import type { GenerationResult } from "./types";

export type ImageProvider = "auto" | "dashscope" | "hf";

function nsfwModeOn(): boolean {
  const v = (process.env.NSFW_MODE || "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function resolveProvider(): "dashscope" | "hf" {
  // 成人向模式：绝不走百炼审核
  if (nsfwModeOn()) return "hf";

  const raw = (process.env.IMAGE_PROVIDER || "hf").toLowerCase().trim();
  if (raw === "dashscope" || raw === "bailian" || raw === "aliyun") {
    return "dashscope";
  }
  if (raw === "hf" || raw === "huggingface" || raw === "fal") {
    return "hf";
  }
  // auto：优先 hf（成人/宽松）；只有 PREFER_DASHSCOPE=1 才自动百炼
  if (
    process.env.PREFER_DASHSCOPE === "1" &&
    process.env.DASHSCOPE_API_KEY?.trim()
  ) {
    return "dashscope";
  }
  return "hf";
}

export async function generateImage(
  prompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const provider = resolveProvider();

  if (provider === "dashscope") {
    return generateWithDashScope(prompt, aspectRatio);
  }

  const result = await generateWithHf(prompt, aspectRatio);
  return {
    ...result,
    provider: "hf",
    model: "Tongyi-MAI/Z-Image-Turbo (fal-ai)",
  };
}

export { HFModelLoadingError, HFRateLimitError } from "./hf";
export type { GenerationResult };
