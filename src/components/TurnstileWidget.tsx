"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "dark" | "light" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
  language?: "zh" | "en";
}

export default function TurnstileWidget({ siteKey, onToken, language = "en" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    // clear previous
    containerRef.current.innerHTML = "";
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;

    const existing = document.getElementById(SCRIPT_ID);
    if (window.turnstile) {
      renderWidget();
      return;
    }

    if (!existing) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
      s.async = true;
      window.onTurnstileLoad = () => renderWidget();
      document.head.appendChild(s);
    } else {
      window.onTurnstileLoad = () => renderWidget();
      // script may already be loading
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          renderWidget();
        }
      }, 200);
      return () => clearInterval(t);
    }
  }, [siteKey, renderWidget]);

  return (
    <div className="flex flex-col items-center gap-1 my-2">
      <div ref={containerRef} />
      <p className="text-[10px] text-[#5a5a5a]">
        {language === "zh"
          ? "请完成人机验证后再生成"
          : "Complete the check before generating"}
      </p>
    </div>
  );
}
