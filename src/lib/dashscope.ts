/**
 * 阿里云百炼 (DashScope) 文生图客户端。
 * 支持 z-image-turbo / qwen-image 等同步 multimodal-generation 接口。
 *
 * 文档:
 * - https://help.aliyun.com/zh/model-studio/z-image-api-reference
 * - https://help.aliyun.com/zh/model-studio/qwen-image-api
 * - https://help.aliyun.com/zh/model-studio/text-to-image
 *
 * 默认端点（仅需 API Key，无需 Workspace）:
 *   POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
 *
 * 若控制台要求 MaaS 业务空间，可设:
 *   DASHSCOPE_BASE_URL=https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
 */

import { DIMENSIONS, AspectRatio } from "./dimensions";
import type { GenerationResult } from "./types";

const DEFAULT_BASE =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

/** 常用百炼文生图模型（控制台开通后可用） */
export const DASHSCOPE_MODELS = {
  "z-image-turbo": "z-image-turbo",
  "qwen-image": "qwen-image",
  "qwen-image-plus": "qwen-image-plus",
  "qwen-image-2.0": "qwen-image-2.0",
  "qwen-image-2.0-pro": "qwen-image-2.0-pro",
  "wan2.7-image": "wan2.7-image",
  "wan2.7-image-pro": "wan2.7-image-pro",
  "wan2.6-t2i": "wan2.6-t2i",
} as const;

/** DashScope size 字段常用 "宽*高" */
function toDashScopeSize(aspectRatio: AspectRatio): string {
  const size = DIMENSIONS[aspectRatio] || DIMENSIONS["1:1"];
  // 部分模型要求边长为特定步进；保持与项目 DIMENSIONS 一致
  return `${size.width}*${size.height}`;
}

function extractImageUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const output = root.output as Record<string, unknown> | undefined;

  // 新版 multimodal: output.choices[].message.content[].image
  const choices = output?.choices as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const message = choice.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part && typeof part === "object") {
            const img = (part as { image?: string; url?: string }).image
              ?? (part as { url?: string }).url;
            if (typeof img === "string" && img.startsWith("http")) return img;
          }
        }
      }
      // 有时 content 是字符串 URL
      if (typeof message?.content === "string" && message.content.startsWith("http")) {
        return message.content;
      }
    }
  }

  // 旧版 results: output.results[].url
  const results = output?.results as Array<{ url?: string }> | undefined;
  if (Array.isArray(results)) {
    for (const r of results) {
      if (r?.url?.startsWith("http")) return r.url;
    }
  }

  // 直接 output.image / output.url
  if (typeof output?.image === "string" && output.image.startsWith("http")) {
    return output.image;
  }
  if (typeof output?.url === "string" && output.url.startsWith("http")) {
    return output.url;
  }

  return null;
}

/**
 * 使用阿里云百炼生成图片，返回 PNG/JPEG bytes。
 * @param modelOverride 单次请求模型，如 qwen-image-2.0 / wan2.7-image-pro
 */
export async function generateWithDashScope(
  prompt: string,
  aspectRatio: AspectRatio = "1:1",
  modelOverride?: string
): Promise<GenerationResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY not set");

  const model =
    modelOverride?.trim() ||
    process.env.DASHSCOPE_MODEL?.trim() ||
    "qwen-image-2.0";
  const baseUrl =
    process.env.DASHSCOPE_BASE_URL?.replace(/\/+$/, "") || DEFAULT_BASE;
  const size = toDashScopeSize(aspectRatio);
  const watermark = process.env.DASHSCOPE_WATERMARK === "true";
  // 千问建议可开 prompt_extend；要省钱/更快可设 DASHSCOPE_PROMPT_EXTEND=false
  const promptExtend = process.env.DASHSCOPE_PROMPT_EXTEND !== "false";

  const body = {
    model,
    input: {
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
    },
    parameters: {
      size,
      n: 1,
      watermark,
      prompt_extend: promptExtend,
      ...(process.env.DASHSCOPE_NEGATIVE_PROMPT
        ? { negative_prompt: process.env.DASHSCOPE_NEGATIVE_PROMPT }
        : {
            // 默认给千问一点质量向负向（合规内容场景）
            negative_prompt:
              "低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，文字模糊扭曲",
          }),
    },
  };

  let response: Response;
  try {
    response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // 百炼同步生图可能 >10s；Vercel Hobby 仍可能超时，建议 Pro 或异步
      signal: AbortSignal.timeout(55_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`DashScope network error: ${msg}`);
  }

  const rawText = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(
      `DashScope non-JSON ${response.status}: ${rawText.slice(0, 200)}`
    );
  }

  const obj = parsed as {
    code?: string;
    message?: string;
    request_id?: string;
  };

  if (!response.ok) {
    throw new Error(
      `DashScope HTTP ${response.status}: ${
        obj.message || obj.code || rawText.slice(0, 200)
      }`
    );
  }

  // 业务错误有时 HTTP 200 但带 code
  if (obj.code && obj.code !== "Success" && String(obj.code) !== "200") {
    throw new Error(
      `DashScope error ${obj.code}: ${obj.message || "unknown"}`
    );
  }

  const imageUrl = extractImageUrl(parsed);
  if (!imageUrl) {
    throw new Error(
      `DashScope returned no image URL: ${rawText.slice(0, 300)}`
    );
  }

  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`DashScope image download failed: ${msg}`);
  }

  if (!imgRes.ok) {
    throw new Error(`DashScope image download HTTP ${imgRes.status}`);
  }

  const imageBytes = Buffer.from(await imgRes.arrayBuffer());
  if (imageBytes.length < 100) {
    throw new Error("DashScope downloaded image is empty/too small");
  }

  return {
    imageBytes,
    seed: Date.now(),
    provider: "dashscope",
    model,
  };
}
