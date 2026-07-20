import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";
import { ContactMail } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "联系我们",
  description: "联系免费 AI 画图",
};

export default function ContactZh() {
  return (
    <SiteChrome locale="zh">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">联系我们</span>
        </h1>
        <p className="text-[#a0a0a0] mb-8 text-sm">
          问题、反馈或隐私相关请求，请发邮件。
        </p>

        <div className="glass-card rounded-2xl p-6 mb-8">
          <p className="text-xs text-[#6b6b6b] uppercase tracking-wider mb-2">邮箱</p>
          <p className="text-lg">
            <ContactMail locale="zh" />
          </p>
          <p className="text-xs text-[#6b6b6b] mt-4">通常在 24–48 小时内回复（视情况而定）。</p>
        </div>

        <h2 className="text-white font-semibold mb-3 text-sm">常见问题</h2>
        <div className="space-y-3 text-sm text-[#b0b0b0]">
          <div className="glass-card rounded-xl p-4">
            <p className="text-white text-sm font-medium">生成失败？</p>
            <p className="mt-1 text-xs">
              可简化提示词、切换用途，或稍后再试。站点可能有频率限制。
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white text-sm font-medium">如何提高质量？</p>
            <p className="mt-1 text-xs">
              尽量写清主体、构图、光线、材质与风格，具体描述通常比空泛形容词更有效。
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white text-sm font-medium">无法下载？</p>
            <p className="mt-1 text-xs">使用「下载」按钮，或右键图片另存为。</p>
          </div>
        </div>

        <Link
          href="/zh"
          className="inline-block mt-8 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white text-sm"
        >
          去创作
        </Link>
      </main>
    </SiteChrome>
  );
}
