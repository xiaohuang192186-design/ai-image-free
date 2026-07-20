/**
 * Unified image generation entry.
 *
 * IMAGE_PROVIDER:
 *   - auto      : DASHSCOPE_API_KEY 存在则用百炼，否则 HF/fal
 *   - dashscope : 强制阿里云百炼（需 DASHSCOPE_API_KEY）
 *   - hf        : 强制 HuggingFace Router + fal-ai（需 HF_TOKEN）
 */

import { AspectRatio } from "./dimensions";
import { generateWithDashScope } from "./dashscope";
import { generateImage as generateWithHf } from "./hf";
import type { GenerationResult } from "./types";

export type ImageProvider = "auto" | "dashscope" | "hf";

export function resolveProvider(): "dashscope" | "hf" {
  const raw = (process.env.IMAGE_PROVIDER || "auto").toLowerCase().trim();
  if (raw === "dashscope" || raw === "bailian" || raw === "aliyun") {
    return "dashscope";
  }
  if (raw === "hf" || raw === "huggingface" || raw === "fal") {
    return "hf";
  }
  // auto
  if (process.env.DASHSCOPE_API_KEY?.trim()) return "dashscope";
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
