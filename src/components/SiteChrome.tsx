"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Locale = "en" | "zh";

const NAV = {
  en: {
    home: "Home",
    examples: "Examples",
    blog: "Blog",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    brand: "AI Free Image",
    tagline: "Free AI image tools",
  },
  zh: {
    home: "主页",
    examples: "示例",
    blog: "博客",
    about: "关于",
    contact: "联系",
    privacy: "隐私",
    terms: "条款",
    brand: "免费 AI 画图",
    tagline: "免费图片处理工具",
  },
} as const;

function prefix(locale: Locale) {
  return locale === "zh" ? "/zh" : "";
}

function href(locale: Locale, path: string) {
  if (path === "/") return locale === "zh" ? "/zh" : "/";
  return `${prefix(locale)}${path}`;
}

export function detectLocale(pathname: string | null): Locale {
  if (pathname?.startsWith("/zh")) return "zh";
  return "en";
}

export default function SiteChrome({
  locale,
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const loc = locale ?? detectLocale(pathname);
  const t = NAV[loc];
  const other = loc === "zh" ? "EN" : "中文";
  const otherHref =
    loc === "zh"
      ? pathname === "/zh"
        ? "/"
        : (pathname || "/").replace(/^\/zh/, "") || "/"
      : pathname === "/"
        ? "/zh"
        : `/zh${pathname || ""}`;

  const links = [
    { label: t.home, path: "/" },
    { label: t.examples, path: "/examples" },
    { label: t.blog, path: "/blog" },
    { label: t.about, path: "/about" },
    { label: t.contact, path: "/contact" },
  ];

  const legal = [
    { label: t.privacy, path: "/privacy" },
    { label: t.terms, path: "/terms" },
  ];

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="border-b border-white/[0.06] bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href={href(loc, "/")} className="font-semibold text-sm sm:text-base">
            <span className="gradient-text">🎨 {t.brand}</span>
            <span className="hidden sm:inline text-[#6b6b6b] font-normal ml-2 text-xs">
              {t.tagline}
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap justify-end">
            {links.map((l) => (
              <Link
                key={l.path}
                href={href(loc, l.path)}
                className="px-2 py-1 rounded text-[#a0a0a0] hover:text-white hover:bg-white/5 transition"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={otherHref}
              className="ml-1 px-2 py-1 rounded text-[#8b5cf6] hover:bg-purple-500/10"
            >
              {other}
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-white/[0.06] mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <p className="font-medium text-sm text-white/90">🎨 {t.brand}</p>
              <p className="text-xs text-[#6b6b6b] mt-1 max-w-xs">
                {loc === "zh"
                  ? "无需注册的文生图工具。选择用途、输入描述即可出图。"
                  : "Text-to-image tools without sign-up. Pick a use case and create."}
              </p>
            </div>
            <div className="flex gap-10 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="text-[#6b6b6b] uppercase tracking-wider text-[10px]">
                  {loc === "zh" ? "导航" : "Nav"}
                </span>
                {links.map((l) => (
                  <Link
                    key={l.path}
                    href={href(loc, l.path)}
                    className="text-[#a0a0a0] hover:text-white"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[#6b6b6b] uppercase tracking-wider text-[10px]">
                  {loc === "zh" ? "法律" : "Legal"}
                </span>
                {legal.map((l) => (
                  <Link
                    key={l.path}
                    href={href(loc, l.path)}
                    className="text-[#a0a0a0] hover:text-white"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#3a3a3a] mt-8 pt-4 border-t border-white/[0.04]">
            © {new Date().getFullYear()} {t.brand}.{" "}
            {loc === "zh" ? "为公平使用设有频率限制。" : "Fair-use rate limits apply."}
          </p>
        </div>
      </footer>
    </div>
  );
}
