import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "示例",
  description: "免费 AI 画图提示词示例",
};

const EXAMPLES = [
  {
    title: "雨巷小提琴",
    prompt:
      "雨夜鹅卵石小巷里的街头小提琴手，霓虹倒影，电影感，浅景深",
  },
  {
    title: "手表产品图",
    prompt: "白大理石上的奢华手表产品图，柔和阴影，棚拍光，极简高端",
  },
  {
    title: "植物手绘",
    prompt: "异域花朵的科学植物手绘插画，线描精细，复古图鉴风",
  },
  {
    title: "雾中森林",
    prompt: "秋日雾中的森林小径，金色光线穿过树叶，宁静的艺术摄影",
  },
];

export default function ExamplesZh() {
  return (
    <SiteChrome locale="zh">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">示例</span>
        </h1>
        <p className="text-[#a0a0a0] text-sm mb-8">复制提示词，到主页试试。</p>
        <div className="space-y-4">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="glass-card rounded-xl p-5">
              <h2 className="text-white font-medium text-sm">{ex.title}</h2>
              <p className="text-[#9a9a9a] text-xs sm:text-sm mt-2 leading-relaxed">
                {ex.prompt}
              </p>
              <Link
                href={`/zh?q=${encodeURIComponent(ex.prompt)}`}
                className="inline-block mt-3 text-xs text-[#8b5cf6] hover:underline"
              >
                使用此提示词 →
              </Link>
            </div>
          ))}
        </div>
      </main>
    </SiteChrome>
  );
}
