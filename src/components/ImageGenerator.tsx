"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { DIMENSIONS, type AspectRatio } from "@/lib/dimensions";
import TurnstileWidget from "./TurnstileWidget";

export type Locale = "en" | "zh";

interface GenerationState {
  status: "idle" | "loading" | "done" | "error";
  imageUrl: string | null;
  errorMessage: string | null;
  retryAfter: number | null;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

/** 前端可选模型：fal 弱审；百炼千问/万相有平台审核 */
type ModelChoice = {
  id: string;
  provider: "fal" | "dashscope";
  model?: string;
  labelEn: string;
  labelZh: string;
  hintEn: string;
  hintZh: string;
};

const MODEL_CHOICES: ModelChoice[] = [
  {
    id: "fal-z",
    provider: "fal",
    labelEn: "Z-Image Turbo (fast)",
    labelZh: "Z-Image 快速",
    hintEn: "Cheap & fast · weaker filters (fal)",
    hintZh: "便宜快 · 弱审（fal 直连）",
  },
  {
    id: "qwen-2",
    provider: "dashscope",
    model: "qwen-image-2.0",
    labelEn: "Qwen-Image 2.0",
    labelZh: "千问 2.0",
    hintEn: "Best text & edit · moderated (Bailian)",
    hintZh: "文字/改图强 · 百炼有审核",
  },
  {
    id: "qwen-2-pro",
    provider: "dashscope",
    model: "qwen-image-2.0-pro",
    labelEn: "Qwen-Image 2.0 Pro",
    labelZh: "千问 2.0 Pro",
    hintEn: "Higher quality Qwen · moderated",
    hintZh: "千问更高画质 · 有审核",
  },
  {
    id: "wan-pro",
    provider: "dashscope",
    model: "wan2.7-image-pro",
    labelEn: "Wan 2.7 Pro",
    labelZh: "万相 2.7 Pro",
    hintEn: "4K / complex scenes · moderated",
    hintZh: "复杂指令/4K · 有审核",
  },
];

const COPY = {
  en: {
    title: "AI Image Generator",
    subtitle: "Turn words into stunning images. Pick a model below.",
    placeholder:
      "Describe the image you want to create... e.g. A magical forest with glowing mushrooms, digital art",
    ratio: "Ratio",
    model: "Model",
    generate: "Generate",
    generating: "Generating...",
    download: "Download",
    generateNew: "Generate New",
    failed: "Generation Failed",
    tryAgain: "Try again",
    emptyTitle: "Your generated image will appear here",
    emptyHint: "Enter a prompt above and click Generate",
    examples: "Try these examples",
    creating: "Creating your image...",
    footer: "Powered by AI · Rate limits apply · Bailian models are content-moderated",
    switchLang: "中文",
    switchHref: "/zh",
    needTurnstile: "Please complete human verification first.",
    ads: "AdSense Banner 728×90",
  },
  zh: {
    title: "免费 AI 图片生成器",
    subtitle: "可选 Z-Image / 千问 / 万相 · 有频率限制",
    placeholder:
      "描述你想生成的图片… 例如：雨夜霓虹街头的小提琴手，电影感，浅景深",
    ratio: "比例",
    model: "模型",
    generate: "生成",
    generating: "生成中...",
    download: "下载",
    generateNew: "再生成一张",
    failed: "生成失败",
    tryAgain: "重试",
    emptyTitle: "生成的图片将显示在这里",
    emptyHint: "在上方输入描述，点击生成",
    examples: "试试这些提示词",
    creating: "正在创作你的图片...",
    footer: "AI 驱动 · 有频率限制 · 千问/万相走百炼内容审核",
    switchLang: "English",
    switchHref: "/",
    needTurnstile: "请先完成人机验证。",
    ads: "广告位 728×90",
  },
} as const;

const EXAMPLES: Record<Locale, string[]> = {
  en: [
    "A serene Japanese garden with cherry blossoms, koi pond, soft morning light, photorealistic",
    "Futuristic cyberpunk city at night, neon lights, rain-soaked streets, cinematic",
    "Cute fluffy cat wearing a wizard hat, digital art, whimsical fantasy",
    "Ancient dragon on a mountain peak, stormy sky, epic fantasy art",
    "Minimalist modern living room, warm sunlight, cozy interior design",
    "Astronaut playing guitar on the moon, retro wave, vibrant colors",
  ],
  zh: [
    "雨夜鹅卵石小巷里的街头小提琴手，霓虹倒影，电影感，浅景深",
    "白大理石上的奢华手表产品图，柔和阴影，棚拍光，极简高端",
    "异域花朵的科学植物手绘插画，线描精细，复古图鉴风",
    "秋日雾中的森林小径，金色光线穿过树叶，宁静的艺术摄影",
    "赛博朋克夜晚的东京街景，霓虹灯，积水倒影，电影级光效",
    "古风少女站在竹林中，薄雾，柔光，写实人像摄影",
  ],
};

interface Props {
  locale?: Locale;
}

export default function ImageGenerator({ locale = "en" }: Props) {
  const t = COPY[locale];
  const examples = EXAMPLES[locale];
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("1:1");
  const [modelId, setModelId] = useState("fal-z");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [genState, setGenState] = useState<GenerationState>({
    status: "idle",
    imageUrl: null,
    errorMessage: null,
    retryAfter: null,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = genState.status === "loading";
  const hasImage = genState.status === "done" && genState.imageUrl !== null;

  const dims = useMemo(() => DIMENSIONS[ratio] || DIMENSIONS["1:1"], [ratio]);

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    if (siteKey && !turnstileToken) {
      setGenState({
        status: "error",
        imageUrl: null,
        errorMessage: t.needTurnstile,
        retryAfter: null,
      });
      return;
    }

    setGenState({
      status: "loading",
      imageUrl: null,
      errorMessage: null,
      retryAfter: null,
    });

    const choice =
      MODEL_CHOICES.find((m) => m.id === modelId) || MODEL_CHOICES[0];

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          aspect_ratio: ratio,
          provider: choice.provider,
          ...(choice.model ? { model: choice.model } : {}),
          ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 503 && body.retryAfter) {
          throw { message: body.error, retryAfter: body.retryAfter };
        }
        const extra = body.detail ? ` (${body.detail})` : "";
        throw new Error(
          (body.error || `Generation failed (HTTP ${res.status})`) + extra
        );
      }

      if (!body.imageUrl) {
        throw new Error(
          locale === "zh" ? "未返回图片地址" : "No image URL returned"
        );
      }

      setGenState({
        status: "done",
        imageUrl: body.imageUrl,
        errorMessage: null,
        retryAfter: null,
      });
      // token 一次性，生成后清空，需重新点验证（若启用）
      setTurnstileToken(null);
    } catch (err: unknown) {
      const retryAfter = (err as { retryAfter?: number }).retryAfter ?? null;
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string }).message ||
            (locale === "zh" ? "发生未知错误" : "An unexpected error occurred");
      setGenState({
        status: "error",
        imageUrl: null,
        errorMessage: msg,
        retryAfter,
      });
    }
  }, [
    prompt,
    ratio,
    modelId,
    isLoading,
    siteKey,
    turnstileToken,
    t.needTurnstile,
    locale,
  ]);

  const handleReset = useCallback(() => {
    setGenState({
      status: "idle",
      imageUrl: null,
      errorMessage: null,
      retryAfter: null,
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!genState.imageUrl) return;
    try {
      const res = await fetch(genState.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(genState.imageUrl, "_blank");
    }
  }, [genState.imageUrl]);

  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
    setGenState({
      status: "idle",
      imageUrl: null,
      errorMessage: null,
      retryAfter: null,
    });
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12 md:py-16">
        <header className="text-center mb-8 sm:mb-10 animate-fade-in-up relative w-full max-w-2xl">
          <a
            href={t.switchHref}
            className="absolute right-0 top-0 text-xs text-[#8b5cf6] hover:text-[#a78bfa] underline-offset-2 hover:underline"
          >
            {t.switchLang}
          </a>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="gradient-text">🎨 {t.title}</span>
          </h1>
          <p className="text-base sm:text-lg text-[#a0a0a0] max-w-lg mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </header>

        <section
          className="w-full max-w-2xl mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
          aria-label="prompt"
        >
          <div className="glass-card p-4 sm:p-5 gradient-border-glow rounded-2xl">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              rows={4}
              disabled={isLoading}
              className="w-full resize-none bg-transparent text-white placeholder-[#6b6b6b] text-sm sm:text-base
                         border-none outline-none leading-relaxed
                         disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="prompt"
            />

            {/* Model picker */}
            <div className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs text-[#6b6b6b]">{t.model}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {MODEL_CHOICES.map((m) => {
                  const active = modelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setModelId(m.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-all
                        ${
                          active
                            ? "border-purple-500/60 bg-purple-500/15 text-white"
                            : "border-white/10 bg-white/[0.03] text-[#a0a0a0] hover:bg-white/[0.06]"
                        }
                        disabled:opacity-50`}
                    >
                      <div className="font-medium">
                        {locale === "zh" ? m.labelZh : m.labelEn}
                      </div>
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {locale === "zh" ? m.hintZh : m.hintEn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-[#6b6b6b] mr-1 hidden sm:inline">
                {t.ratio}:
              </span>
              <div className="grid grid-cols-4 sm:flex sm:flex-row gap-1.5 w-full sm:w-auto">
                {ASPECT_RATIOS.map(({ value, label }) => {
                  const d = DIMENSIONS[value];
                  const isActive = ratio === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRatio(value)}
                      disabled={isLoading}
                      title={`${d.width}×${d.height}`}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white shadow-lg shadow-purple-500/20"
                            : "bg-white/5 text-[#a0a0a0] hover:bg-white/10 hover:text-white"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      aria-pressed={isActive}
                    >
                      {label}
                      <span className="block text-[9px] opacity-70 font-normal">
                        {d.width}×{d.height}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading || (Boolean(siteKey) && !turnstileToken)}
                className="w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 px-6 py-2.5 rounded-xl
                           bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]
                           text-white font-semibold text-sm
                           hover:from-[#9b6df7] hover:to-[#4b92f7]
                           disabled:from-[#4a4a4a] disabled:to-[#3a3a3a]
                           disabled:text-[#888] disabled:cursor-not-allowed
                           transition-all duration-200 shadow-lg shadow-purple-500/10"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t.generating}
                  </span>
                ) : (
                  <>
                    {t.generate} <span className="ml-1">✨</span>
                  </>
                )}
              </button>
            </div>

            {siteKey ? (
              <TurnstileWidget
                siteKey={siteKey}
                onToken={setTurnstileToken}
                language={locale}
              />
            ) : null}
          </div>
        </section>

        <section
          className="w-full max-w-2xl mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
          aria-label="ad"
        >
          <div className="flex items-center justify-center h-[90px] rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <span className="text-xs text-[#4a4a4a]">{t.ads}</span>
          </div>
        </section>

        <section
          className="w-full max-w-2xl animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
          aria-label="result"
        >
          {genState.status === "loading" && (
            <div className="glass-card p-4 rounded-2xl" role="status">
              <div
                className="skeleton-shimmer rounded-xl mx-auto"
                style={{
                  width: "100%",
                  maxWidth: dims.width > dims.height ? "100%" : "400px",
                  aspectRatio: `${dims.width} / ${dims.height}`,
                }}
              />
              <p className="text-center text-[#a0a0a0] text-sm mt-4 animate-pulse">
                {t.creating}
              </p>
            </div>
          )}

          {hasImage && (
            <article className="glass-card p-3 sm:p-4 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={genState.imageUrl!}
                alt={prompt || "AI generated"}
                className="w-full h-auto rounded-xl animate-fade-in"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
                loading="lazy"
              />
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/15"
                >
                  {t.download}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white font-medium text-sm"
                >
                  {t.generateNew}
                </button>
              </div>
            </article>
          )}

          {genState.status === "error" && (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4"
              role="alert"
            >
              <p className="text-red-400 text-sm font-medium">{t.failed}</p>
              <p className="text-red-300/70 text-sm mt-0.5">
                {genState.errorMessage}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                {t.tryAgain}
              </button>
            </div>
          )}

          {genState.status === "idle" && !prompt.trim() && (
            <div className="glass-card p-6 sm:p-8 rounded-2xl text-center">
              <div className="text-5xl mb-4 opacity-40">🖼️</div>
              <p className="text-[#6b6b6b] text-sm">{t.emptyTitle}</p>
              <p className="text-[#4a4a4a] text-xs mt-1">{t.emptyHint}</p>
            </div>
          )}
        </section>

        {genState.status !== "done" && (
          <section
            className="w-full max-w-2xl mt-8 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-3">
              ✨ {t.examples}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]
                             hover:bg-white/[0.06] text-[#a0a0a0] hover:text-white text-xs sm:text-sm
                             leading-relaxed transition-all truncate"
                  title={example}
                >
                  {example.length > 80 ? example.slice(0, 80) + "…" : example}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="text-center py-6 px-4 border-t border-white/[0.06]">
        <p className="text-xs text-[#4a4a4a]">{t.footer}</p>
        <p className="text-xs text-[#3a3a3a] mt-1">
          © {new Date().getFullYear()} AI Image Generator
        </p>
      </footer>
    </div>
  );
}
