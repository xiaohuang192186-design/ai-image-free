import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "博客",
  description: "免费 AI 画图技巧与说明",
};

export default function BlogZh() {
  return (
    <SiteChrome locale="zh">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">博客</span>
        </h1>
        <p className="text-[#a0a0a0] text-sm mb-8">提示词与工具小记，后续会继续更新。</p>
        <article className="glass-card rounded-xl p-5">
          <p className="text-[11px] text-[#6b6b6b]">2026 年 7 月</p>
          <h2 className="text-white font-medium mt-1">如何写出更好的提示词</h2>
          <p className="text-[#9a9a9a] text-sm mt-2 leading-relaxed">
            先写主体，再补场景、光线、材质与风格。具体的光影与构图描述，往往比只堆「8K超清」更有效。
          </p>
          <Link href="/zh" className="text-xs text-[#8b5cf6] mt-3 inline-block">
            去主页试试 →
          </Link>
        </article>
      </main>
    </SiteChrome>
  );
}
