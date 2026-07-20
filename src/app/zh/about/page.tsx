import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "关于",
  description: "关于免费 AI 画图 — 无需注册的文生图工具",
};

export default function AboutZh() {
  return (
    <SiteChrome locale="zh">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="gradient-text">关于我们</span>
        </h1>
        <p className="text-[#a0a0a0] mb-10 leading-relaxed">
          面向创作者的免费 AI 图片工具：打开即用，无需注册，输出不加我们控制的强制水印。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            ["100%", "免费试用"],
            ["0", "强制注册"],
            ["0", "强制水印"],
            ["在线", "按可用性提供"],
          ].map(([a, b]) => (
            <div key={b} className="glass-card rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-white">{a}</p>
              <p className="text-[11px] text-[#7a7a7a] mt-1">{b}</p>
            </div>
          ))}
        </div>

        <section className="space-y-4 text-sm text-[#b0b0b0] leading-relaxed mb-10">
          <h2 className="text-white text-lg font-semibold">我们的做法</h2>
          <p>
            很多 AI 画图产品是：注册 → 送一点额度 → 付费墙。我们希望减少摩擦：打开页面、描述需求、得到结果；
            同时用合理频率限制控制成本、保持稳定。
          </p>
          <p>
            技术上可能使用 Serverless 托管、对象存储，以及第三方或开源权重推理。可选广告用于覆盖运营成本。
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#b0b0b0] mb-10">
          <h2 className="text-white text-lg font-semibold">你能做什么</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>多种比例文生图</li>
            <li>按用途选择（日常、海报文字、商业复杂场景等）</li>
            <li>下载 PNG；个人或商业使用时请自行遵守法律与第三方许可</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/zh"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white text-sm font-medium"
          >
            开始创作
          </Link>
          <Link
            href="/zh/contact"
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm"
          >
            联系我们
          </Link>
          <Link href="/zh/privacy" className="px-5 py-2.5 rounded-xl text-[#8b5cf6] text-sm">
            隐私政策
          </Link>
        </div>
      </main>
    </SiteChrome>
  );
}
