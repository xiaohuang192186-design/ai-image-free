"use client";

import { useState, useRef, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

interface GenerationState {
  status: "idle" | "loading" | "done" | "error";
  imageUrl: string | null;
  errorMessage: string | null;
  retryAfter: number | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Available aspect ratios — must match src/lib/dimensions.ts */
const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

/** Example prompts that users can click to auto-fill */
const EXAMPLE_PROMPTS = [
  "A serene Japanese garden with cherry blossoms, koi pond, stone lanterns, soft morning light, photorealistic",
  "Futuristic cyberpunk city at night, neon lights, flying cars, rain-soaked streets, cinematic lighting",
  "Cute fluffy cat wearing a wizard hat, casting magic spells, digital art, whimsical fantasy style",
  "Ancient dragon perched on a mountain peak, stormy sky, lightning, epic fantasy art, highly detailed",
  "Minimalist modern living room, warm sunlight through large windows, cozy atmosphere, interior design",
  "Astronaut playing electric guitar on the moon, earth in background, retro wave style, vibrant colors",
];

// ============================================================================
// Component
// ============================================================================

export default function HomePage() {
  // ---- State ----
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("1:1");
  const [genState, setGenState] = useState<GenerationState>({
    status: "idle",
    imageUrl: null,
    errorMessage: null,
    retryAfter: null,
  });

  // ---- Refs ----
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---- Derived ----
  const isLoading = genState.status === "loading";
  const hasImage = genState.status === "done" && genState.imageUrl !== null;

  // =========================================================================
  // Handlers
  // =========================================================================

  /** Handle prompt submission — calls the API to generate an image */
  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setGenState({ status: "loading", imageUrl: null, errorMessage: null, retryAfter: null });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, aspect_ratio: ratio }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 503 = model loading, auto-retry after retryAfter seconds
        if (res.status === 503 && body.retryAfter) {
          throw { message: body.error, retryAfter: body.retryAfter };
        }
        throw new Error(body.error || `Generation failed (HTTP ${res.status})`);
      }

      if (!body.imageUrl) {
        throw new Error("No image URL returned from the API");
      }

      setGenState({
        status: "done",
        imageUrl: body.imageUrl,
        errorMessage: null,
        retryAfter: null,
      });
    } catch (err: unknown) {
      const retryAfter = (err as { retryAfter?: number }).retryAfter ?? null;
      setGenState({
        status: "error",
        imageUrl: null,
        errorMessage: err instanceof Error ? err.message : "An unexpected error occurred",
        retryAfter,
      });
    }
  }, [prompt, ratio, isLoading]);

  /** Reset the UI to initial state so the user can generate a new image */
  const handleReset = useCallback(() => {
    setGenState({ status: "idle", imageUrl: null, errorMessage: null, retryAfter: null });
  }, []);

  /** Download the generated image */
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
      // Fallback: open in new tab
      window.open(genState.imageUrl, "_blank");
    }
  }, [genState.imageUrl]);

  /** Fill prompt with an example and focus the textarea */
  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
    setGenState({ status: "idle", imageUrl: null, errorMessage: null, retryAfter: null });
    textareaRef.current?.focus();
  }, []);

  /** Keyboard: Enter to submit, Ctrl+Enter for newline */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  // =========================================================================
  // Render helpers
  // =========================================================================

  /** Image dimensions for the given aspect ratio (matches src/lib/dimensions.ts) */
  const getImageDimensions = (): { width: number; height: number } => {
    switch (ratio) {
      case "16:9": return { width: 1152, height: 648 };
      case "9:16": return { width: 648,  height: 1152 };
      case "4:3":  return { width: 1024, height: 768 };
      case "3:4":  return { width: 768,  height: 1024 };
      case "1:1":
      default:     return { width: 1024, height: 1024 };
    }
  };

  const dims = getImageDimensions();

  // =========================================================================
  // JSX
  // =========================================================================

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* ================================================================= */}
      {/* MAIN CONTENT                                                      */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12 md:py-16">
        {/* ---- Header ---- */}
        <header className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="gradient-text">🎨 AI Image Generator</span>
          </h1>
          <p className="text-base sm:text-lg text-[#a0a0a0] max-w-lg mx-auto leading-relaxed">
            Turn words into stunning images for free.
            <br />
            No sign-up required — just describe and create.
          </p>
        </header>

        {/* ---- Prompt Input Section ---- */}
        <section
          className="w-full max-w-2xl mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
          aria-label="Image generation prompt"
        >
          <div className="glass-card p-4 sm:p-5 gradient-border-glow rounded-2xl">
            {/* Prompt textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the image you want to create... e.g. A magical forest with glowing mushrooms and fairy lights, digital art style"
              rows={4}
              disabled={isLoading}
              className="w-full resize-none bg-transparent text-white placeholder-[#6b6b6b] text-sm sm:text-base
                         border-none outline-none leading-relaxed
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-opacity duration-200"
              aria-label="Image description prompt"
            />

            {/* Aspect ratio selector */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-[#6b6b6b] mr-1 hidden sm:inline">
                Ratio:
              </span>
              <div className="grid grid-cols-4 sm:flex sm:flex-row gap-1.5 w-full sm:w-auto">
                {ASPECT_RATIOS.map(({ value, label }) => {
                  const isActive = ratio === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setRatio(value)}
                      disabled={isLoading}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white shadow-lg shadow-purple-500/20"
                            : "bg-white/5 text-[#a0a0a0] hover:bg-white/10 hover:text-white"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      aria-pressed={isActive}
                      aria-label={`Aspect ratio ${label}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 px-6 py-2.5 rounded-xl
                           bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]
                           text-white font-semibold text-sm
                           hover:from-[#9b6df7] hover:to-[#4b92f7]
                           disabled:from-[#4a4a4a] disabled:to-[#3a3a3a]
                           disabled:text-[#888] disabled:cursor-not-allowed
                           transition-all duration-200
                           shadow-lg shadow-purple-500/10
                           hover:shadow-purple-500/25 hover:scale-[1.02]
                           active:scale-[0.98]"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <>
                    Generate <span className="ml-1">✨</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ---- AdSense Banner Placeholder ---- */}
        <section
          className="w-full max-w-2xl mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
          aria-label="Advertisement"
        >
          <div className="flex items-center justify-center h-[90px] rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <span className="text-xs text-[#4a4a4a]">
              AdSense Banner 728×90 —{' '}
              <code className="text-[#5a5a5a]">ca-pub-XXXXXXXXXX</code>
            </span>
          </div>
        </section>

        {/* ---- Result Section ---- */}
        <section
          className="w-full max-w-2xl animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
          aria-label="Generated image result"
        >
          {/* -- Loading skeleton -- */}
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
                Creating your image<span className="animate-pulse">...</span>
              </p>
            </div>
          )}

          {/* -- Generated image -- */}
          {hasImage && (
            <article className="glass-card p-3 sm:p-4 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={genState.imageUrl!}
                alt={prompt || "AI generated image"}
                className="w-full h-auto rounded-xl animate-fade-in"
                style={{
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
                loading="lazy"
              />

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                {/* Download */}
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl
                             bg-white/10 text-white font-medium text-sm
                             hover:bg-white/15
                             transition-all duration-200
                             flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download
                </button>

                {/* Generate New */}
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl
                             bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]
                             text-white font-medium text-sm
                             hover:from-[#9b6df7] hover:to-[#4b92f7]
                             transition-all duration-200
                             flex items-center gap-2
                             shadow-lg shadow-purple-500/10"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2M15 15H9"
                    />
                  </svg>
                  Generate New
                </button>
              </div>
            </article>
          )}

          {/* -- Error state -- */}
          {genState.status === "error" && (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4
                          animate-fade-in"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-red-400 text-sm font-medium">
                    Generation Failed
                  </p>
                  <p className="text-red-300/70 text-sm mt-0.5">
                    {genState.errorMessage}
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline underline-offset-2
                               transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -- Empty state (idle, no prompt yet) -- */}
          {genState.status === "idle" && !prompt.trim() && (
            <div className="glass-card p-6 sm:p-8 rounded-2xl text-center">
              <div className="text-5xl mb-4 opacity-40">🖼️</div>
              <p className="text-[#6b6b6b] text-sm">
                Your generated image will appear here
              </p>
              <p className="text-[#4a4a4a] text-xs mt-1">
                Enter a prompt above and click Generate
              </p>
            </div>
          )}
        </section>

        {/* ---- Example Prompts ---- */}
        {genState.status !== "done" && (
          <section
            className="w-full max-w-2xl mt-8 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
            aria-label="Example prompts"
          >
            <h2 className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-3">
              ✨ Try these examples
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="text-left px-4 py-3 rounded-xl
                             bg-white/[0.03] border border-white/[0.06]
                             hover:bg-white/[0.06] hover:border-white/[0.12]
                             text-[#a0a0a0] hover:text-white
                             text-xs sm:text-sm leading-relaxed
                             transition-all duration-200
                             truncate"
                  title={example}
                >
                  {example.length > 80
                    ? example.slice(0, 80) + "…"
                    : example}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="text-center py-6 px-4 border-t border-white/[0.06]">
        <p className="text-xs text-[#4a4a4a]">
          Powered by AI · Free image generation · No sign-up required
        </p>
        <p className="text-xs text-[#3a3a3a] mt-1">
          © {new Date().getFullYear()} AI Image Generator. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
